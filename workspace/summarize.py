import csv
from collections import defaultdict


def load_rows(path="sales.csv"):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def revenue_by_month(rows):
    totals = defaultdict(float)
    for row in rows:
        month = row["date"][:7]
        totals[month] += float(row["quantity"])  # BUG: ignores unit_price
    return dict(sorted(totals.items()))


if __name__ == "__main__":
    for month, total in revenue_by_month(load_rows()).items():
        print(f"{month}\t{total:.2f}")
