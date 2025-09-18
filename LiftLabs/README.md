# LiftLabs Poker Bench

LiftLabs is evolving into a poker-inspired performance bench that quantifies daily training, nutrition, and recovery signals with the rigor you would expect from an esports analytics lab. The mobile app still runs on Expo + React Native, but under the hood we are standardizing every touch point (strength logs, calorie tracking, streaks, and body composition work) so that we can publish research-grade insights and confidence intervals around an athlete's growth.

---

## Quick start

1. Install dependencies

   ```bash
   npm install
   ```

2. Run the development server

   ```bash
   npx expo start
   ```

The default Expo CLI dashboard will give you options to open the project in Expo Go, development builds, simulators, or the browser preview.

---

## Scientific framework

### Current factor library

The "poker bench" rating pipeline ingests the following normalized signals. Each signal is stored in Supabase using the existing tables that power the app's UX:

| Factor | Supabase source | Description | Weight (wᵢ) |
| --- | --- | --- | --- |
| **Strength output** | `strength_logs` | One-rep max (rep_max), total tonnage, and velocity annotations from the strength logging workflow. After body-weight scaling we convert the highest rep-max for the session into a z-score. | 0.35 |
| **Volume & density** | `strength_logs` | Session tonnage divided by duration (or set count when duration is missing). High density sessions yield higher scores. | 0.15 |
| **Consistency streak** | `profile.streak` via `lib/streak.js` | Daily streak length penalized for missed days (exponentially weighted so that long streaks stabilize). | 0.20 |
| **Body composition trend** | `body_fat_entries` and `weight_logs` | Rolling 14-day change in body-fat % and body mass. Improvements relative to the athlete's intent (cut/bulk/maintain) add points. | 0.10 |
| **Nutritional adherence** | `calorie_logs`, macro entries in `CalorieTracker.js` | Difference between prescribed macros and actual intake. Closer adherence pushes the score upward. | 0.10 |
| **Skill & engagement** | Challenge completions (`ChallengesScreen`) and EXP (`profile.exp`) | XP earned, premium challenges cleared, and community participation signal the player's metagame awareness. | 0.10 |

Weights are stored in the research notebook for now; when we productionize the bench we will persist them in Supabase to enable A/B testing.

### Factor normalization

For each session *t* and factor *i* we compute a standardized observation `z_{i,t}`:

```
z_{i,t} = s_i * (x_{i,t} - μ_i) / σ_i
```

- `x_{i,t}` is the raw metric (e.g., body-weight adjusted 1RM).
- `μ_i` and `σ_i` are running means and standard deviations maintained per cohort (gender, training age, competitive tier).
- `s_i` flips the sign when lower values are better (e.g., calorie deviation, body fat).

The factor composite for the session is a weighted sum:

```
P_t = Σ_i w_i * z_{i,t}
```

We map `P_t` onto a probability space with a logistic bridge that is steeper than chess-style Elo to reflect the heavier tails in strength outcomes:

```
S_t = 1 / (1 + exp(-β * P_t))
```

`β` is currently set to 1.7 based on the observed spread of z-scores during alpha testing.

### Elo-style update using all factors

Each athlete carries a bench rating `R_t`. When a session is logged we evaluate it against the dynamic difficulty `D_t` (e.g., the quality of the plan, competition field, or historical self-play) and compute the expectation:

```
E_t = 1 / (1 + 10^(-(R_t - D_t) / 400))
```

We then update the rating with the composite outcome `S_t`:

```
R_{t+1} = R_t + K_t * (S_t - E_t)
```

- `K_t` defaults to 24 but tapers to 12 once we have ≥60 rated sessions to reflect increased certainty.
- The composite outcome uses **all** factors through `S_t`, so nutrition lapses or streak breaks materially move the rating even if the day's 1RM was strong.
- When a live competition or scrimmage occurs we replace `D_t` with the field-weighted rating and set `S_t` to the actual finish percentile to keep the bench aligned with real poker results.

To maintain interpretability we also publish the marginal contributions of each factor:

```
ΔR_{i,t} = K_t * w_i * z_{i,t} * β * S_t * (1 - S_t)
```

These contributions let us explain to athletes why a session moved their number up or down.

---

## Confidence intervals & variance tracking

A research-grade rating must broadcast its uncertainty. We propagate variance from the factor level all the way to the Elo estimate.

1. **Factor variance.** For each factor we maintain an exponentially weighted variance `σ²_{i,t}`. When a new observation lands we update it via:
   
   ```
   σ²_{i,t} = λ σ²_{i,t-1} + (1 - λ) (x_{i,t} - μ_i)^2
   ```
   
   with `λ = 0.9` for stability. This keeps the bench responsive to new training phases.

2. **Composite variance.** Using the delta method on the logistic bridge we approximate the variance of `S_t`:
   
   ```
   Var[S_t] ≈ (β * S_t * (1 - S_t))^2 * Σ_i w_i^2 * σ²_{i,t} / σ_i^2
   ```
   
   where `σ_i` is the reference standard deviation from the normalization step.

3. **Rating variance.** The innovation term of the Elo update is `Δ_t = S_t - E_t`. Assuming independence across sessions (a conservative stance) we accumulate variance over `n` observations:
   
   ```
   Var[R_n] = Σ_{t=1}^n K_t^2 * Var[Δ_t]
   Var[Δ_t] ≈ Var[S_t] + E_t (1 - E_t)
   ```

4. **Confidence interval.** The 95% confidence interval reported in the app is:
   
   ```
   CI_{95} = R_n ± 1.96 * sqrt(Var[R_n])
   ```
   
   We also display the running half-width to help decide when more data is needed before declaring a true performance jump.

5. **CI variance trend.** To make the research output friendlier we chart the variance term over time. A widening CI indicates either noisy training inputs (macro adherence slipping) or sparse logging; a narrowing CI confirms that the athlete's story is statistically defensible.

---

## Research roadmap

- **Data hygiene.** Finish Supabase migrations so every table referenced above enforces units, timestamps, and foreign-key consistency.
- **Factor audits.** Schedule quarterly recalibration of `w_i`, `μ_i`, and `σ_i` using Bayesian hierarchical models so that demographic subgroups remain fair.
- **Causal experiments.** Use the streak + nutrition modules to run self-controlled trials (A-B-A designs) and measure how interventions move the Elo curve.
- **Manuscript prep.** Target a sports analytics or human performance venue. The README equations double as the Methods section scaffolding.

---

## Tech stack highlights

- **Frontend:** Expo + React Native (`App.js`, `ProfileScreen.js`, `StrengthTraining.js`, etc.).
- **Backend:** Supabase tables for profiles, logs, nutrition, and challenges.
- **ML/Analytics:** Currently prototyped in notebooks; the formulas above are the contract we will code-gen into Supabase functions or a dedicated analytics worker.

---

## Contributing & future work

1. Clone the repository and create a feature branch (do not commit directly to main).
2. Run `npm run lint` before opening a pull request.
3. Document any changes to the factor weights or variance model directly in this README so the research trail stays intact.

Once the poker bench stabilizes we will version the methodology and release anonymized aggregates for the broader community.
