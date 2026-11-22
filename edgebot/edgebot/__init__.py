"""EdgeBot: a personal football betting assistant that only recommends bets with a measured edge."""
import os as _os

# The maths here works on many small matrices; multi-threaded BLAS makes that ~50x slower.
for _var in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
    _os.environ.setdefault(_var, "1")

__version__ = "0.2.0"
