"""
Inference Rule Modules

Each rule is an independent module with a single Rule subclass.
Adding INF006+ means: create inf006.py, add import + append below.
"""

from typing import List, Type
from compiler.inference.rule import Rule

_RULE_CLASSES: List[Type[Rule]] = []

# Import each rule module and register its class
from compiler.inference.rules.inf001 import Inf001Rule
_RULE_CLASSES.append(Inf001Rule)

from compiler.inference.rules.inf002 import Inf002Rule
_RULE_CLASSES.append(Inf002Rule)

from compiler.inference.rules.inf003 import Inf003Rule
_RULE_CLASSES.append(Inf003Rule)

from compiler.inference.rules.inf004 import Inf004Rule
_RULE_CLASSES.append(Inf004Rule)

from compiler.inference.rules.inf005 import Inf005Rule
_RULE_CLASSES.append(Inf005Rule)


def _import_all_rules() -> List[Type[Rule]]:
    """Return list of all discovered Rule subclasses."""
    return list(_RULE_CLASSES)
