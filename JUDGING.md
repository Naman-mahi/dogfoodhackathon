# JUDGING.md: Assignment Strategy, Scoring Math & Normalization Proof

## 1. Executive Summary

In distributed hackathons, raw average scoring is fundamentally broken:
- **Judge Severity Bias:** A mediocre project evaluated by a lenient judge will outscore an exceptional project evaluated by a harsh judge.
- **Sparse, Unbalanced Review Batches:** Not all judges complete their assigned batches. In `fixtures.json`, review counts vary from 1 to 11 per judge.
- **Degenerate Distributions:** Some judges assign identical scores across their entire batch (e.g. `jdg_07` in `fixtures.json` gave 4s to every project, resulting in sample standard deviation $\sigma = 0$).

To solve this, DOGFOOD implements an **Empirical Bayes Z-Score Normalization Engine** paired with a **Weighted Multi-Criteria Rubric** and strict **Backend Role Isolation**.

---

## 2. Multi-Criteria Rubric & Raw Score Aggregation

For judge $j$ evaluating project $i$ on criterion $c$ with score $s_{ij,c} \in [1, 5]$, the raw weighted score $R_{ij}$ is:
$$R_{ij} = \sum_{c \in C} w_c \cdot s_{ij,c}$$

In the standard `fixtures.json` dataset:
- Criteria: `functionality` ($w=1/3$), `quality` ($w=1/3$), `innovation` ($w=1/3$).

---

## 3. The Normalization Method: Empirical Bayes Z-Score Normalization

### 3.1 The Flaw of Naive Z-Score
Naive Z-score division by sample standard deviation causes division by zero (`NaN`) whenever:
1. A judge completes only 1 review ($N_j = 1$).
2. A judge gives flat identical ratings (zero variance).

### 3.2 The Solution: Empirical Bayes Shrinkage
We stabilize individual judge estimates by shrinking judge-level parameters toward global event priors using pseudo-observations $k$ ($k = 2.0$):

1. **Global Priors:**
   $$M_0 = \frac{1}{M}\sum R, \quad V_0 = \frac{1}{M}\sum (R - M_0)^2, \quad S_0 = \sqrt{V_0}$$

2. **Smoothed Judge Mean ($\hat{\mu}_j$):**
   $$\hat{\mu}_j = \frac{N_j \bar{R}_j + k M_0}{N_j + k}$$

3. **Smoothed Judge Variance ($\hat{\sigma}_j^2$):**
   $$\hat{\sigma}_j^2 = \frac{\sum_{k=1}^{N_j} (R_{kj} - \bar{R}_j)^2 + k V_0}{N_j + k}$$
   Because $k V_0 > 0$, **$\hat{\sigma}_j$ is strictly positive for all judges ($\hat{\sigma}_j > 0$)**.

4. **Normalized & Calibrated Score ($S_{ij}^*$):**
   $$z_{ij} = \frac{R_{ij} - \hat{\mu}_j}{\hat{\sigma}_j}$$
   $$S_{ij}^* = M_0 + z_{ij} \cdot S_0$$

5. **Final Project Aggregation:**
   $$\bar{S}_i = \frac{1}{|J_i|} \sum_{j \in J_i} S_{ij}^*$$
