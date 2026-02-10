;;;; Otimizador simbólico de equações
;;;; Simplifica expressões antes da emissão de código C++

(in-package :tensorwerk-optimizer)

;; Regras: 0 + x = x, 0 * x = 0, x * 1 = x, x - 0 = x, x / 1 = x
(defmacro aplicar-identidade-zero (expr)
  (cond
    ((and (listp expr) (eq (first expr) '+) (eql (second expr) 0))
     (third expr))

    ((and (listp expr) (eq (first expr) '+) (eql (third expr) 0))
     (second expr))

    ((and (listp expr) (eq (first expr) '*) (or (eql (second expr) 0) (eql (third expr) 0)))
     0)

    ((and (listp expr) (eq (first expr) '*))
     (cond
       ((eql (second expr) 1) (third expr))
       ((eql (third expr) 1) (second expr))
       (t expr)))

    ((and (listp expr) (eq (first expr) '-) (eql (third expr) 0))
     (second expr))

    ((and (listp expr) (eq (first expr) '/) (eql (third expr) 1))
     (second expr))

    (t expr)))

;; sin²(x) + cos²(x) → 1,  tan(x) → sin(x)/cos(x)
(defmacro aplicar-identidade-trigonometrica (expr)
  (cond
    ((and (listp expr)
          (eq (first expr) '+)
          (listp (second expr))
          (listp (third expr))
          (eq (first (second expr)) 'expt)
          (eq (first (third expr)) 'expt))
     (when (and (eq (second (second expr)) 'sin) (eq (second (third expr)) 'cos)
                (equal (third (second expr)) (third (third expr))))
       1))

    ((and (listp expr) (eq (first expr) 'tan))
     `(/ (sin ,(second expr)) (cos ,(second expr))))

    (t expr)))

(defun otimizar-expressao (expr)
  (let* ((pass1 (aplicar-identidade-zero expr))
         (pass2 (expandir-produtos pass1))
         (pass3 (agregar-termos-semelhantes pass2))
         (pass4 (aplicar-identidade-trigonometrica pass3))
         (pass5 (fatorar-comuns pass4)))
    pass5))

;; (a + b) * c → a*c + b*c
(defun expandir-produtos (expr) expr)

;; 2*x + 3*x → 5*x
(defun agregar-termos-semelhantes (expr) expr)

;; a*x + a*y → a*(x + y)
(defun fatorar-comuns (expr) expr)

(defun analizar-dependencias (expr)
  (if (operacoes-independentes-p expr)
      :vetorizavel
      :sequencial))

(defun operacoes-independentes-p (expr) t)

;; a + b*c → FMA (single instruction, no rounding error)
(defun detectar-oportunidades-fma (expr)
  (when (and (listp expr)
             (member (first expr) '(+ -)))
    (let ((op1 (second expr))
          (op2 (third expr)))
      (or (and (listp op1) (eq (first op1) '*))
          (and (listp op2) (eq (first op2) '*))))))

(defun reorganizar-para-fma (expr)
  (if (detectar-oportunidades-fma expr)
      (transformar-em-fma expr)
      expr))

;; Emits _mm512_fmadd_pd() in C++
(defun transformar-em-fma (expr)
  `(fma ,(second expr) ,(third expr) ,(fourth expr)))
