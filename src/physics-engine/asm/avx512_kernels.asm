; Kernel AVX-512 para contração tensorial: C^μ_ν = Σ_λ A^μ_λ B^λ_ν

default rel

section .text
align 64

global tensorwerk_avx512_contract_22
tensorwerk_avx512_contract_22:
    push rbx
    push rbp
    push r12
    push r13
    push r14
    push r15

    xor rax, rax
.outer_mu:
    xor rbx, rbx
.outer_nu:
        vpxord zmm0, zmm0, zmm0

        xor rcx, rcx
.inner_lambda:
            ; A[μ][λ] broadcast → zmm1
            mov rdx, rax
            shl rdx, 2
            add rdx, rcx
            mov r15, rdx
            shl r15, 3
            add r15, rdi
            vbroadcastsd zmm1, [r15]

            ; B[λ][*] → zmm2
            mov rdx, rcx
            shl rdx, 2
            mov r15, rdx
            shl r15, 3
            add r15, rsi
            vmovapd zmm2, [r15]

            ; FMA: acc += A[μ][λ] * B[λ][*]
            vfmadd231pd zmm0, zmm1, zmm2

            inc rcx
            cmp rcx, 4
            jl .inner_lambda

        ; Horizontal reduction: 8 doubles → 1
        vextractf64x4 ymm1, zmm0, 1
        vaddpd ymm0, ymm0, ymm1

        vextractf128 xmm2, ymm0, 1
        vaddpd xmm0, xmm0, xmm2

        vmovhlps xmm1, xmm1, xmm0
        vaddpd xmm0, xmm0, xmm1

        vmovsd [r13 + rbx * 8], xmm0

        inc rbx
        cmp rbx, 4
        jl .outer_nu

    inc rax
    cmp rax, 4
    jl .outer_mu

    pop r15
    pop r14
    pop r13
    pop r12
    pop rbp
    pop rbx
    ret

; R = g^μν R_μν  (Ricci scalar via trace contraction)
global tensorwerk_avx512_ricci_scalar
tensorwerk_avx512_ricci_scalar:
    push rbx
    push r12

    vpxord zmm0, zmm0, zmm0

    xor rax, rax
.loop_mu:
    xor rbx, rbx
.loop_nu:
        ; g_inv[μ][ν] → zmm1
        mov rcx, rax
        shl rcx, 2
        add rcx, rbx
        mov r12, rcx
        shl r12, 3
        add r12, rdi
        vbroadcastsd zmm1, [r12]

        ; ricci[μ][ν] → zmm2
        mov rcx, rax
        shl rcx, 2
        add rcx, rbx
        mov r12, rcx
        shl r12, 3
        add r12, rsi
        vbroadcastsd zmm2, [r12]

        vfmadd231pd zmm0, zmm1, zmm2

        inc rbx
        cmp rbx, 4
        jl .loop_nu

    inc rax
    cmp rax, 4
    jl .loop_mu

    ; Horizontal reduction
    vextractf64x4 ymm1, zmm0, 1
    vaddpd ymm0, ymm0, ymm1

    vextractf128 xmm2, ymm0, 1
    vaddpd xmm0, xmm0, xmm2

    vmovhlps xmm1, xmm1, xmm0
    vaddpd xmm0, xmm0, xmm1

    vmovsd [rdx], xmm0

    pop r12
    pop rbx
    ret

; C_ij = Σ_k A_ik B_kj  (4x4 matrix multiply)
; RDI = A[4][4], RSI = B[4][4], RDX = C[4][4]
global tensorwerk_avx512_matmul_4x4
tensorwerk_avx512_matmul_4x4:
    push rbx
    push rbp
    push r12
    push r13
    push r14

    xor rax, rax
.loop_i:
    xor rbx, rbx
.loop_j:
        vpxord zmm0, zmm0, zmm0

        xor rcx, rcx
.loop_k:
            ; A[i][k] broadcast
            mov rdx, rax
            shl rdx, 2
            add rdx, rcx
            mov r13, rdx
            shl r13, 3
            add r13, rdi
            vbroadcastsd zmm1, [r13]

            ; B[k][*]
            mov rdx, rcx
            shl rdx, 2
            mov r13, rdx
            shl r13, 3
            add r13, rsi
            vmovapd zmm2, [r13]

            vfmadd231pd zmm0, zmm1, zmm2

            inc rcx
            cmp rcx, 4
            jl .loop_k

        ; Store C[i][j]
        mov rdx, rax
        shl rdx, 2
        add rdx, rbx
        mov r13, rdx
        shl r13, 3
        add r13, rdx
        vmovsd [r13], xmm0

        inc rbx
        cmp rbx, 4
        jl .loop_j

    inc rax
    cmp rax, 4
    jl .loop_i

    pop r14
    pop r13
    pop r12
    pop rbp
    pop rbx
    ret

; Normalize u^μ such that g_μν u^μ u^ν = -1
; RDI = g[4][4], RSI = u[4], RDX = u_out[4]
global tensorwerk_avx512_normalize_velocity
tensorwerk_avx512_normalize_4velocity:
    push rbx
    push r12
    sub rsp, 64                 ; Allocate 64 bytes

    vmovapd xmm0, [rsi]
    vinsertf128 ymm0, ymm0, [rsi + 16], 1
    vinsertf64x4 zmm0, zmm0, [rsi + 32], 1

    vmovupd [rsp], zmm0         ; Store u to stack for indexed access

    ; norm = g_μν u^μ u^ν
    vpxord zmm1, zmm1, zmm1

    xor rax, rax
.loop_mu:
    xor rbx, rbx
.loop_nu:
            mov rcx, rax
            shl rcx, 2
            add rcx, rbx
            mov r12, rcx
            shl r12, 3
            add r12, rdi
            vmovsd xmm2, [r12]

            vmovsd xmm3, [rsp + rax*8]
            vmovsd xmm4, [rsp + rbx*8]

            vmulsd xmm2, xmm2, xmm3
            vfmadd231sd xmm1, xmm2, xmm4

            inc rbx
            cmp rbx, 4
            jl .loop_nu

    inc rax
    cmp rax, 4
    jl .loop_mu

    add rsp, 64                 ; Deallocate stack

    ; |norm| = abs(norm)
    vmovsd xmm2, [abs_mask]
    vandpd xmm2, xmm2, xmm1

    ; sqrt(|norm|)
    vsqrtsd xmm2, xmm2, xmm2

    ; 1 / sqrt(|norm|)
    vmovsd xmm3, [one_point_zero]
    vdivsd xmm2, xmm3, xmm2

    vbroadcastsd zmm2, xmm2
    vmulpd zmm0, zmm0, zmm2

    vmovapd [rdx], zmm0

    pop r12
    pop rbx
    ret

section .rodata
align 64

gather_indices:
    dq 0, 1, 2, 3, 4, 5, 6, 7

all_ones_mask:
    dq 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF
    dq 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF

abs_mask:
    dq 0x7FFFFFFFFFFFFFFF, 0x0
    dq 0x0, 0x0

one_point_zero:
    dq 1.0
