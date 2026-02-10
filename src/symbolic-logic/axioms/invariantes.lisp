;;;; Invariantes financeiros — axiomas do espaço-tempo financeiro

(in-package :tensorwerk-axioms)

;;; Invariante de Conservação de Liquidez
(define-symbolic-macro liquidez-total (L)
  (+ (liquidez-ordens-compra L)
     (liquidez-ordens-venda L)
     (liquidez-oculta L)))

;;; Curvatura local: proporcional à densidade de capital
(define-symbolic-macro curvatura-local (K x y t)
  (/ (* densidade-capital (x y t))
     (modulo-metrica (x y t) 2)))

;;; Métrica de Minkowski modificada: diag(-1, 1, 1, 1)
(define-symbolic-macro metrica-financeira (g_mu_nu)
  (let ((diag '(-1.0d0 1.0d0 1.0d0 1.0d0)))
    (make-tensor 'diagonal diag)))

;;; Divergência livre: ∇·J = 0
(define-symbolic-macro divergencia-zero (J)
  (= (divergencia J) 0))

;;; ρ_capital → ∞  ⟹  K → ∞  (singularidade)
(defmacro singularidade-liquidez-p (estado)
  `(> (curvatura-total ,estado)
      *limiar-singularidade*))

;;; Preços seguem geodésicas no espaço-tempo curvo
(defmacro geodesica-preco (p_inicial direcao)
  `(solve-geodesic-equation
    (metrica-financeira *metrica-atual*)
    ,p_inicial
    ,direcao))

(defparameter +c-luz-financ+ 299792458.0d0)
(defparameter +h-barra+ 1.054571817e-34)
(defparameter +G-newton+ 6.67430e-11)
(defparameter +limiar-crash+ 0.95d0)
(defparameter +epsilon-liquidez+ 1e-6)

(defun calcular-densidade-capital (volume volatilidade)
  (/ (* volume (expt volatilidade 2))
     (+ +epsilon-liquidez+ volume)))

;; r_s = 2GM / c²
(defun calcular-raio-schwarzschild (liquidez)
  (/ (* 2 +G-newton+ liquidez)
     (expt +c-luz-financ+ 2)))

(defun horizonte-eventos-p (preco liquidez-local)
  (let ((r-s (calcular-raio-schwarzschild liquidez-local)))
    (< (distancia-origem preco) r-s)))

(defun potenciais-newtonianos (massas posicoes)
  (mapcar (lambda (m p)
            (/ (* +G-newton+ m)
               (expt (norma p) 2)))
          massas posicoes))

(defmacro definir-lei-campo (nome parametros &body corpo)
  `(defun ,nome ,parametros
     (declare (optimize (speed 3) (safety 0) (debug 0)))
     (symbolic-progn
       :derivavel t
       :tipo 'equacao-diferencial-parcial
       :espaco 'riemanniano
       ,@corpo)))

;; Γ^k_ij = ½ g^kl(∂g_il/∂x^j + ∂g_jl/∂x^i - ∂g_ij/∂x^l)
(defmacro tensor-christoffel (metrica i j k)
  `(let ((g-inverse (inverter-tensor ,metrica)))
     (* 0.5d0
        (contracao-tensor
         g-inverse
         (+ (derivada-parcial ,metrica ,i ,k)
            (derivada-parcial ,metrica ,j ,k)
            (- (derivada-parcial ,metrica ,i ,j)))))))
