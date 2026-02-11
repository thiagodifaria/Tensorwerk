#include "../include/riemann_manifold.hpp"
#include <iostream>
#include <vector>
#include <thread>
#include <chrono>
#include <random>
#include <iomanip>

using namespace tensorwerk;

// Helper to print JSON
void print_json_state(size_t tick, const RiemannManifold& manifold) {
    // Mock values for now, but formatted as JSON
    // standard output is buffered, so we need to flush or endl
    
    std::cout << "{"
              << "\"type\": \"tensor_update\","
              << "\"tick\": " << tick << ","
              << "\"metric\": [";

    // Randomize metric for demo
    static std::mt19937 gen(42);
    std::uniform_real_distribution<> dis(-0.5, 0.5);

    for(int i=0; i<4; ++i) {
        std::cout << "[";
        for(int j=0; j<4; ++j) {
            double val = (i==j) ? 1.0 : 0.0;
            // Add noise
            val += dis(gen) * 0.1;
            std::cout << std::fixed << std::setprecision(4) << val;
            if (j < 3) std::cout << ",";
        }
        std::cout << "]";
        if (i < 3) std::cout << ",";
    }

    std::cout << "],"
              << "\"ricci_scalar\": " << (0.02 + dis(gen) * 0.01) << ","
              << "\"latency\": " << (4.2 + dis(gen)) 
              << "}" << std::endl;
}

int main() {
    // Print a normal log first
    std::cout << "{\"type\": \"log\", \"message\": \"[Physics Engine] Initializing 4D Manifold...\"}" << std::endl;

    // Instantiate (mock)
    RiemannManifold manifold;

    std::cout << "{\"type\": \"log\", \"message\": \"[Physics Engine] Simulation Loop Started.\"}" << std::endl;

    size_t tick = 0;
    while (true) {
        // Output JSON State
        print_json_state(tick, manifold);

        if (tick % 50 == 0) {
             std::cout << "{\"type\": \"log\", \"message\": \"[Physics Engine] Heartbeat tick: " << tick << "\"}" << std::endl;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(100)); // 10Hz
        tick++;
    }

    return 0;
}
