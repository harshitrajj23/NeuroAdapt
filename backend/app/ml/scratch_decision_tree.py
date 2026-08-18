"""
Pure-Python Decision Tree Classifier implemented from scratch.
Uses Gini Impurity for node splitting criteria.
"""

import math
from typing import List, Dict, Any, Optional, Tuple

class Node:
    def __init__(
        self,
        feature: Optional[int] = None,
        threshold: Optional[float] = None,
        left: Optional['Node'] = None,
        right: Optional['Node'] = None,
        gain: float = 0.0,
        value: Optional[Any] = None
    ):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.gain = gain
        self.value = value

    @property
    def is_leaf(self) -> bool:
        return self.value is not None


class ScratchDecisionTreeClassifier:
    """
    Supervised Decision Tree Classifier built from scratch.
    Capable of training on tabular child performance metrics.
    """
    def __init__(self, min_samples_split: int = 2, max_depth: int = 10):
        self.min_samples_split = min_samples_split
        self.max_depth = max_depth
        self.root: Optional[Node] = None

    def _gini(self, y: List[Any]) -> float:
        if not y:
            return 0.0
        total = len(y)
        counts = {}
        for item in y:
            counts[item] = counts.get(item, 0) + 1
        impurity = 1.0 - sum((count / total) ** 2 for count in counts.values())
        return impurity

    def _split(self, X: List[List[float]], y: List[Any], feature: int, threshold: float) -> Tuple[List[List[float]], List[Any], List[List[float]], List[Any]]:
        left_X, left_y = [], []
        right_X, right_y = [], []
        for i in range(len(X)):
            if X[i][feature] <= threshold:
                left_X.append(X[i])
                left_y.append(y[i])
            else:
                right_X.append(X[i])
                right_y.append(y[i])
        return left_X, left_y, right_X, right_y

    def _best_split(self, X: List[List[float]], y: List[Any]) -> Dict[str, Any]:
        best_split = {"gain": -1, "feature": None, "threshold": None, "left_X": None, "left_y": None, "right_X": None, "right_y": None}
        current_gini = self._gini(y)
        num_features = len(X[0]) if X else 0

        for feature in range(num_features):
            # Extract unique values for threshold evaluation
            thresholds = sorted(list(set(row[feature] for row in X)))
            for i in range(len(thresholds) - 1):
                thresh = (thresholds[i] + thresholds[i + 1]) / 2.0
                l_X, l_y, r_X, r_y = self._split(X, y, feature, thresh)

                if len(l_y) == 0 or len(r_y) == 0:
                    continue

                weight_l = len(l_y) / len(y)
                weight_r = len(r_y) / len(y)
                child_gini = weight_l * self._gini(l_y) + weight_r * self._gini(r_y)
                gain = current_gini - child_gini

                if gain > best_split["gain"]:
                    best_split = {
                        "gain": gain,
                        "feature": feature,
                        "threshold": thresh,
                        "left_X": l_X,
                        "left_y": l_y,
                        "right_X": r_X,
                        "right_y": r_y
                    }
        return best_split

    def _most_common_label(self, y: List[Any]) -> Any:
        if not y:
            return None
        counts = {}
        for item in y:
            counts[item] = counts.get(item, 0) + 1
        return max(counts, key=counts.get)

    def _build_tree(self, X: List[List[float]], y: List[Any], depth: int = 0) -> Node:
        num_samples = len(X)
        num_labels = len(set(y))

        # Check stopping criteria
        if depth >= self.max_depth or num_labels == 1 or num_samples < self.min_samples_split:
            leaf_val = self._most_common_label(y)
            return Node(value=leaf_val)

        best_split = self._best_split(X, y)

        if best_split["gain"] <= 0 or best_split["feature"] is None:
            return Node(value=self._most_common_label(y))

        left_child = self._build_tree(best_split["left_X"], best_split["left_y"], depth + 1)
        right_child = self._build_tree(best_split["right_X"], best_split["right_y"], depth + 1)

        return Node(
            feature=best_split["feature"],
            threshold=best_split["threshold"],
            left=left_child,
            right=right_child,
            gain=best_split["gain"]
        )

    def fit(self, X: List[List[float]], y: List[Any]):
        """Train decision tree on feature matrix X and target labels y."""
        self.root = self._build_tree(X, y)

    def _predict_one(self, node: Node, x: List[float]) -> Any:
        if node.is_leaf:
            return node.value
        if x[node.feature] <= node.threshold:
            return self._predict_one(node.left, x)
        return self._predict_one(node.right, x)

    def predict(self, X: List[List[float]]) -> List[Any]:
        """Predict labels for sample matrix X."""
        return [self._predict_one(self.root, sample) for sample in X]
