;;;; SISTEMA SIMBÓLICO tensorwerk
;;;; Meta-compilador de equações de campo financeiro
;;;; Este sistema deriva simbolicamente as equações diferenciais
;;;; que governam a geometria do mercado em tempo real.

(defsystem :tensorwerk-symbolic-logic
  :description "Sistema de derivação simbólica e meta-programação para geometria de mercado"
  :version "1.0.0"
  :author "tensorwerk Finance Team"
  :license "MIT"
  :depends-on (:alexandria :iterate :trivia :cl-ppcre)
  :components
  ((:module "axioms"
    :components
    ((:file "invariantes")
     (:file "metric-tensor")
     (:file "riemann-curvature")))
   (:module "derivation"
    :components
    ((:file "field-equations")
     (:file "tensor-deriv")
     (:file "ode-generator")))
   (:module "compiler"
    :components
    ((:module "emitters"
      :components
      ((:file "cpp-emitter")
       (:file "cuda-kernel")))
     (:module "optimizers"
      :components
      ((:file "symbolic-reducer")
       (:file "pattern-matcher"))))))
  :in-order-to ((test-op (test-op :tensorwerk-symbolic-logic/tests))))
