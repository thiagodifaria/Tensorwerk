"""
Neural Stochastic Differential Equations — learns continuous market dynamics
modeled as flows on a Riemannian manifold.

    dX_t = f_θ(X_t, t)dt + g_θ(X_t, t)dW_t

where f_θ is the drift (deterministic, tangent field on manifold),
g_θ is diffusion (stochastic volatility), and dW_t is Wiener noise.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Optional, Tuple, List, Dict, Any
from enum import IntEnum

import jax
import jax.numpy as jnp
import jax.random as jrand
import numpy as np
import optax
import flax.linen as nn
from flax.training import train_state


class SDEType(IntEnum):
    ITO = 0
    STRATONOVICH = 1


@dataclass
class SDEConfig:
    state_dim: int = 4
    hidden_dim: int = 128
    output_dim: int = 4
    num_layers: int = 3
    activation: str = "tanh"
    use_layer_norm: bool = True
    solver: str = "euler"
    dt: float = 0.01
    noise_type: str = "diagonal"
    learning_rate: float = 1e-3
    batch_size: int = 256
    num_epochs: int = 100
    seed: int = 42
    dropout_rate: float = 0.1
    l2_reg: float = 1e-5


class DriftNet(nn.Module):
    """Drift f_θ(x, t): deterministic force / tangent vector field on manifold."""

    config: SDEConfig

    @nn.compact
    def __call__(self, x: jnp.ndarray, t: jnp.ndarray) -> jnp.ndarray:
        h = jnp.concatenate([x, t], axis=-1)

        for i in range(self.config.num_layers):
            h_dense = nn.Dense(
                features=self.config.hidden_dim,
                kernel_init=nn.initializers.xavier_uniform(),
                name=f'dense_{i}'
            )(h)

            if self.config.use_layer_norm:
                h_dense = nn.LayerNorm(name=f'ln_{i}')(h_dense)

            if self.config.activation == "tanh":
                h_act = jnp.tanh(h_dense)
            elif self.config.activation == "relu":
                h_act = jnp.relu(h_dense)
            elif self.config.activation == "swish":
                h_act = jnp.swish(h_dense)
            else:
                raise ValueError(f"Unknown activation: {self.config.activation}")

            h = nn.Dropout(
                rate=self.config.dropout_rate,
                deterministic=False
            )(h_act)

            if i > 0 and h.shape == x.shape:
                h = h + x

        return nn.Dense(
            features=self.config.output_dim,
            kernel_init=nn.initializers.xavier_uniform(),
            name='output'
        )(h)


class DiffusionNet(nn.Module):
    """Diffusion g_θ(x, t): stochastic volatility (must be positive definite)."""

    config: SDEConfig

    @nn.compact
    def __call__(self, x: jnp.ndarray, t: jnp.ndarray) -> jnp.ndarray:
        h = jnp.concatenate([x, t], axis=-1)

        for i in range(self.config.num_layers):
            h = nn.Dense(features=self.config.hidden_dim, name=f'diff_dense_{i}')(h)
            h = nn.LayerNorm(name=f'diff_ln_{i}')(h)
            h = jnp.tanh(h)

        if self.config.noise_type == "diagonal":
            g_log = nn.Dense(features=self.config.output_dim, name='diff_output')(h)
            return jnp.softplus(g_log)
        elif self.config.noise_type == "scalar":
            g_log = nn.Dense(features=1, name='diff_output')(h)
            return jnp.softplus(g_log)
        else:
            raise NotImplementedError("General diffusion not implemented")


class NeuralSDE(nn.Module):
    """dX_t = f_θ(X_t, t)dt + g_θ(X_t, t)dW_t"""

    config: SDEConfig

    def setup(self):
        self.drift_net = DriftNet(self.config)
        self.diff_net = DiffusionNet(self.config)

    def drift(self, x: jnp.ndarray, t: jnp.ndarray) -> jnp.ndarray:
        return self.drift_net(x, t)

    def diffusion(self, x: jnp.ndarray, t: jnp.ndarray) -> jnp.ndarray:
        return self.diff_net(x, t)

    def __call__(
        self,
        x0: jnp.ndarray,
        t_span: Tuple[float, float],
        key: jax.random.PRNGKey,
        solver: str = "euler"
    ) -> jnp.ndarray:
        t0, t1 = t_span
        dt = self.config.dt
        num_steps = int((t1 - t0) / dt)

        def body_fn(carry, step):
            x, key = carry
            t = t0 + step * dt
            t_batch = jnp.full((x.shape[0], 1), t)

            f = self.drift(x, t_batch)
            g = self.diffusion(x, t_batch)

            key, subkey = jrand.split(key)
            dW = jrand.normal(subkey, x.shape) * jnp.sqrt(dt)

            # Euler-Maruyama (Milstein omitted — requires autodiff of g)
            dx = f * dt + g * dW
            x_new = x + dx

            return (x_new, key), x_new

        (_, _), trajectory = jax.lax.scan(body_fn, (x0, key), jnp.arange(num_steps))
        return trajectory


def solve_ode_rk4(
    drift_fn: Callable[[jnp.ndarray, float], jnp.ndarray],
    x0: jnp.ndarray,
    t_span: Tuple[float, float],
    dt: float = 0.01
) -> jnp.ndarray:
    """RK4 solver for ODEs (no noise) — useful for drift validation."""
    t0, t1 = t_span
    num_steps = int((t1 - t0) / dt)

    def rk4_step(x, t):
        k1 = drift_fn(x, t)
        k2 = drift_fn(x + 0.5 * dt * k1, t + 0.5 * dt)
        k3 = drift_fn(x + 0.5 * dt * k2, t + 0.5 * dt)
        k4 = drift_fn(x + dt * k3, t + dt)
        return x + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    def body_fn(x, step):
        t = t0 + step * dt
        x_new = rk4_step(x, t)
        return x_new, x_new

    _, trajectory = jax.lax.scan(body_fn, x0, jnp.arange(num_steps))
    return trajectory


def sde_loss_fn(
    params: Dict,
    model: NeuralSDE,
    x_batch: jnp.ndarray,
    t_batch: jnp.ndarray,
    key: jax.random.PRNGKey
) -> Tuple[jnp.ndarray, Dict]:
    """Loss = reconstruction MSE + drift smoothness regularization."""
    x0 = x_batch[:, 0, :]
    t_span = (t_batch[0, 0, 0], t_batch[0, -1, 0])

    trajectory = model.apply(
        {'params': params}, x0, t_span, key, solver='euler'
    )

    reconstruction_loss = jnp.mean((trajectory - x_batch) ** 2)

    def smoothness_reg_fn(x_t, t):
        drift = model.drift(x_t, t)
        return jnp.sum(drift ** 2)

    sample_x = x_batch[:, ::10, :]
    sample_t = t_batch[:, ::10, :]
    smoothness_loss = jnp.mean(
        jax.vmap(smoothness_reg_fn)(
            sample_x.reshape(-1, sample_x.shape[-1]),
            sample_t.reshape(-1, sample_t.shape[-1])
        )
    )

    total_loss = reconstruction_loss + 1e-3 * smoothness_loss
    metrics = {
        'loss': total_loss,
        'reconstruction': reconstruction_loss,
        'smoothness': smoothness_loss
    }

    return total_loss, metrics


def create_train_state(
    model: NeuralSDE,
    key: jax.random.PRNGKey,
    learning_rate: float
) -> train_state.TrainState:
    x_dummy = jnp.zeros((1, model.config.state_dim))
    params = model.init(key, x_dummy, (0.0, 1.0), key)['params']
    tx = optax.adam(learning_rate)

    return train_state.TrainState.create(
        apply_fn=model.apply, params=params, tx=tx
    )


def train_step(
    state: train_state.TrainState,
    model: NeuralSDE,
    x_batch: jnp.ndarray,
    t_batch: jnp.ndarray,
    key: jax.random.PRNGKey
) -> Tuple[train_state.TrainState, Dict]:
    loss_fn = lambda params: sde_loss_fn(params, model, x_batch, t_batch, key)
    (loss, metrics), grads = jax.value_and_grad(loss_fn, has_aux=True)(state.params)
    return state.apply_gradients(grads=grads), metrics


def generate_synthetic_data(
    key: jax.random.PRNGKey,
    num_samples: int = 1000,
    num_steps: int = 100,
    dt: float = 0.01,
    state_dim: int = 4
) -> Tuple[jnp.ndarray, jnp.ndarray]:
    """Ornstein-Uhlenbeck process: dX = θ(μ - X)dt + σdW"""
    theta, mu, sigma = 0.1, 0.0, 0.2

    x0 = jrand.normal(key, (num_samples, state_dim))

    def ou_step(x, key):
        dW = jrand.normal(key, x.shape) * jnp.sqrt(dt)
        dx = theta * (mu - x) * dt + sigma * dW
        return x + dx, x + dx

    keys = jrand.split(key, num_steps)
    _, trajectories = jax.lax.scan(
        lambda x, k: ou_step(x, k), x0, jnp.stack(keys)
    )

    x = trajectories.T
    t = jnp.linspace(0, num_steps * dt, num_steps)
    t = jnp.tile(t[None, :, None], (num_samples, 1, 1))

    return x, t


if __name__ == "__main__":
    config = SDEConfig(
        state_dim=4, hidden_dim=128, num_layers=3,
        learning_rate=1e-3, batch_size=256, num_epochs=100, seed=42
    )

    model = NeuralSDE(config)

    key = jrand.PRNGKey(config.seed)
    key, data_key = jrand.split(key)
    x_data, t_data = generate_synthetic_data(data_key, num_samples=1000)

    key, init_key = jrand.split(key)
    state = create_train_state(model, init_key, config.learning_rate)

    print(f"Neural SDE initialized")
    print(f"Parameters: {sum(p.size for p in jax.tree_util.tree_leaves(state.params))}")

    for epoch in range(5):
        key, epoch_key = jrand.split(key)
        x_batch = x_data[:config.batch_size]
        t_batch = t_data[:config.batch_size]

        state, metrics = train_step(state, model, x_batch, t_batch, epoch_key)
        print(f"Epoch {epoch}: loss={metrics['loss']:.6f}")

    print("Training complete!")
