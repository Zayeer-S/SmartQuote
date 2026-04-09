import itertools
import os
from typing import Any

import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)

TICKET_TYPES = [1, 2, 3]  # Support, Incident, Enhancement
SEVERITIES = [1, 2, 3, 4]  # Low, Medium, High, Critical
BUSINESS_IMPACTS = [1, 2, 3, 4]  # Minor, Moderate, Major, Critical
AFTER_HOURS = [0, 1]

EMBEDDING_DIM = 1536
EMBEDDING_PCA_COMPONENTS = 32

BASE_HOURLY_RATES = {
    (1, 1): 50.0,
    (1, 2): 55.0,
    (1, 3): 45.0,
    (2, 1): 75.0,
    (2, 2): 80.0,
    (2, 3): 65.0,
    (3, 1): 100.0,
    (3, 2): 110.0,
    (3, 3): 90.0,
    (4, 1): 150.0,
    (4, 2): 160.0,
    (4, 3): 130.0,
}
AFTER_HOURS_MULTIPLIER = 1.5

EFFORT_RANGES = {
    (1, 1): (1.0, 4.0),
    (1, 2): (2.0, 6.0),
    (1, 3): (3.0, 8.0),
    (1, 4): (4.0, 10.0),
    (2, 1): (2.0, 6.0),
    (2, 2): (4.0, 8.0),
    (2, 3): (6.0, 12.0),
    (2, 4): (8.0, 16.0),
    (3, 1): (4.0, 10.0),
    (3, 2): (6.0, 14.0),
    (3, 3): (8.0, 20.0),
    (3, 4): (12.0, 28.0),
    (4, 1): (8.0, 16.0),
    (4, 2): (12.0, 24.0),
    (4, 3): (16.0, 36.0),
    (4, 4): (20.0, 48.0),
}

URGENCY_MULTIPLIERS = {
    (1, 1): 1.0,
    (1, 2): 1.1,
    (1, 3): 1.2,
    (1, 4): 1.4,
    (2, 1): 1.1,
    (2, 2): 1.2,
    (2, 3): 1.4,
    (2, 4): 1.6,
    (3, 1): 1.3,
    (3, 2): 1.5,
    (3, 3): 1.7,
    (3, 4): 2.0,
    (4, 1): 1.6,
    (4, 2): 1.9,
    (4, 3): 2.2,
    (4, 4): 2.5,
}


def derive_priority(
    ticket_severity_id: int,
    business_impact_id: int,
    users_impacted: int,
    deadline_offset_days: float,
):
    """
    Maps inputs to P1-P4 (returned as int 1-4).
    P1 = most urgent, P4 = least urgent.
    Mirrors the priority engine scoring logic in ticket-priority-engine.service.ts.
    """
    score = 0
    score += {1: 1, 2: 2, 3: 3, 4: 4}[ticket_severity_id]
    score += {1: 1, 2: 2, 3: 3, 4: 4}[business_impact_id]

    if users_impacted > 500:
        score += 3
    elif users_impacted > 100:
        score += 2
    elif users_impacted > 10:
        score += 1
    if deadline_offset_days < 1:
        score += 3
    elif deadline_offset_days < 3:
        score += 2
    elif deadline_offset_days < 7:
        score += 1

    if score >= 11:
        return 1  # P1
    elif score >= 8:
        return 2  # P2
    elif score >= 5:
        return 3  # P3
    else:
        return 4  # P4


def compute_targets(row) -> dict[str, Any]:
    s = row["ticket_severity_id"]
    b = row["business_impact_id"]
    t = row["ticket_type_id"]
    aft = row["is_after_hours"]

    effort_min_base, effot_max_base = EFFORT_RANGES[(s, b)]
    urgency = URGENCY_MULTIPLIERS[(s, b)]
    hours_min = effort_min_base * urgency
    hours_max = effot_max_base * urgency
    mid_hours = (hours_min + hours_max) / 2

    base_rate = BASE_HOURLY_RATES[(s, t)]
    rate = base_rate * AFTER_HOURS_MULTIPLIER if aft else base_rate

    noise_pct = rng.normal(0, 0.05)
    cost = max(0.0, mid_hours * rate * (1 + noise_pct))

    priority = derive_priority(
        s, b, int(row["users_impacted"]), float(row["deadline_offset_days"])
    )

    return {
        "estimated_hours_minimum": round(hours_min, 2),
        "estimated_hours_maximum": round(hours_max, 2),
        "estimated_cost": round(cost, 2),
        "suggested_ticket_priority_id": priority,
    }


def simulate_embedding(
    ticket_type_id: int,
    ticket_severity_id: int,
    business_impact_id: int,
    users_impacted: int,
    deadline_offset_days: float,
):
    base = np.zeros(EMBEDDING_DIM)
    base[0] = ticket_type_id / 3.0
    base[1] = ticket_severity_id / 4.0
    base[2] = business_impact_id / 4.0
    base[3] = min(users_impacted / 1000.0, 1.0)
    base[4] = min(deadline_offset_days / 30.0, 1.0)
    base[5] = (ticket_severity_id + business_impact_id) / 8.0
    base[6] = ticket_type_id * 0.1
    base[7] = (users_impacted > 100) * 0.5
    base[8:] = rng.standard_normal(EMBEDDING_DIM - 8) * 0.1
    return base


def generate(n_per_combination) -> pd.DataFrame:
    combinations = list(
        itertools.product(TICKET_TYPES, SEVERITIES, BUSINESS_IMPACTS, AFTER_HOURS)
    )
    total = len(combinations * n_per_combination)

    print(f"Combinations: {len(combinations)}")
    print(f"Rows: {total}")

    records = []
    for tt, sev, biz, aft in combinations:
        for _ in range(n_per_combination):
            users = int(rng.integers(1, 1001))
            offset = round(float(rng.uniform(0.0, 30.0)), 2)

            row = {
                "ticket_type_id": tt,
                "ticket_severity_id": sev,
                "business_impact_id": biz,
                "users_impacted": users,
                "deadline_offset_days": offset,
                "is_after_hours": aft,
            }

            targets = compute_targets(row)
            row.update(targets)

            emb = simulate_embedding(tt, sev, biz, users, offset)
            for i, val in enumerate(emb):
                row[f"embedding_{i}"] = round(float(val), 6)

            records.append(row)

    df = pd.DataFrame(records)

    tabular_cols = [
        "ticket_type_id",
        "ticket_severity_id",
        "business_impact_id",
        "users_impacted",
        "deadline_offset_days",
        "is_after_hours",
    ]
    target_cols = [
        "estimated_hours_minimum",
        "estimated_hours_maximum",
        "estimated_cost",
        "suggested_ticket_priority_id",
    ]

    emb_cols = [f"embedding_{i}" for i in range(EMBEDDING_DIM)]
    df = df[tabular_cols + target_cols + emb_cols]
    return df


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "synthetic_tickets.csv")

    df = generate(25)
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} rows to {out_path}")

    print("Target distributions:")
    print(df["suggested_ticket_priority_id"].value_counts().sort_index())
    print(
        df[
            ["estimated_hours_minimum", "estimated_hours_maximum", "estimated_cost"]
        ].describe()
    )
