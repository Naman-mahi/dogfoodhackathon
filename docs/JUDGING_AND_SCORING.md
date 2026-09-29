# DOGFOOD Judging & Score Calibration Engine

## 1. The Hackathon Scoring Dilemma

In hackathons with dozens of evaluators and scores of projects, raw mathematical averages produce unfair rankings due to two major statistical flaws:
1. **Evaluator Leniency vs. Harshness**: A project judged by three strict evaluators receiving scores of `7.5`, `7.8`, and `8.0` might actually be superior to a project that received `9.0` and `9.2` from two exceptionally lenient evaluators.
2. **Review Count Disparity**: Submissions with only 1 or 2 high scores can prematurely top leaderboards over projects that withstood 5 thorough evaluations with slightly lower variances.

DOGFOOD resolves this through **Empirical Bayes Variance Shrinkage** combined with strict **Zero-Trust Peer Isolation**.

---

## 2. Zero-Trust Peer Isolation Barrier

### Security Principles:
- **No Early Leakage**: Evaluators cannot see competitor scores, peer judge evaluations, or composite leaderboards while the evaluation phase is active.
- **Isolated Queue**: Evaluators are strictly gated to their assigned tracks.
- **Cryptographic Barrier**: Any attempt by an evaluator to inspect another judge's scores via `GET /api/v1/judge/scores?judge=other` immediately raises `HTTP 403 Forbidden` (`PeerIsolationViolationException`).

```
Judge A (jdg_01) ──────► [ Isolation Barrier ] ──────► Own Queue & Scores Only
Judge B (jdg_02) ──────► [ Isolation Barrier ] ──────► Own Queue & Scores Only
Organizer (org_01) ────► [ Isolation Barrier ] ──────► Aggregated Oversight & Progress
```

---

## 3. Evaluation Criteria & Rubrics

Default evaluation rubric is graded across 3 core dimensions on a 1.0 to 10.0 scale:

| Criteria | Default Weight | Description |
|:---|:---:|:---|
| **Functionality** | 40% | Does the code run? Is the feature set complete according to the problem statement? |
| **Code Quality** | 30% | Architectural cleanliness, test coverage, modularity, and error handling. |
| **Innovation** | 30% | Novelty of approach, technical difficulty, and zero-knowledge / algorithmic creativity. |

Organizers can customize these weights dynamically in the **Rubric & Weights** panel (`/dashboard/organizer?tab=rubric`).

---

## 4. Empirical Bayes Calibration Mathematics

DOGFOOD implements empirical Bayes score shrinkage with parameter $k = 2.0$.

### 4.1 Global Priors
Let:
- $N$: Total number of evaluations across all projects.
- $x_{ij}$: Score given by judge $j$ to project $i$.
- $\mu_0$: Global evaluation mean across the entire hackathon:
  $$\mu_0 = \frac{1}{N} \sum_{i} \sum_{j} x_{ij}$$

### 4.2 Raw Project Average
For project $i$ with $n_i$ reviews:
$$\bar{x}_i = \frac{1}{n_i} \sum_{j=1}^{n_i} x_{ij}$$

### 4.3 Bayesian Posterior Shrinkage
To prevent low-sample outliers from skewing rankings, the calibrated score $\hat{\mu}_i$ shrinks the project's raw mean toward the global prior $\mu_0$:

$$\hat{\mu}_i = \frac{n_i \cdot \bar{x}_i + k \cdot \mu_0}{n_i + k}$$

where $k = 2.0$ represents the regularization weight (equivalent to two virtual reviews at the global mean).

### 4.4 Effects of Calibration:
- **High Review Confidence**: When $n_i$ is large (e.g. 5+ reviews), $\frac{n_i}{n_i + k} \approx 1$, allowing the project's actual performance to dominate.
- **Low Review Stabilization**: When $n_i = 1$, the score shrinks moderately toward $\mu_0$, preventing a single generous score from artificially winning the competition.

---

## 5. Algorithmic Round-Robin Track Assignment

To prevent queue starvation and ensure balanced track coverage:
1. Available evaluators $J = \{j_1, j_2, \dots, j_m\}$ and event tracks $T = \{t_1, t_2, \dots, t_p\}$ are indexed.
2. The assignment engine rotates through $T$, assigning $K$ judges (default: 2 per track) in round-robin fashion:
   $$j_{(i + k) \pmod m}$$
3. The updated assignments are written to PostgreSQL and recorded in the audit log.
4. Organizers can trigger auto-assignment at any time with one click from the **Judge Evaluation Progress** console (`/manage-evaluations`).

---

## 6. Official CSV Matrix Export

The official score matrix exported via `/api/export.csv` contains:
- `Rank`: Calibrated competition position.
- `Project ID`: Unique submission identifier.
- `Project Title`: Submission name.
- `Track`: Competition track.
- `Team`: Submitting team name.
- `Reviews Count`: Total evaluations completed for this submission.
- `Raw Score`: Unweighted arithmetic average.
- `Calibrated Score`: Bayesian posterior score ($\hat{\mu}_i$).
- `Individual Judge Scores`: Colon-separated criterion scores per judge.
