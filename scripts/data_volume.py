import util
import pandas as pd

data_dir = "data/题目1-2 交通态势可视分析/交通态势可视分析"

interval = 300
records = util.add_records(data_dir, interval)
pd.DataFrame(records).to_csv("data_volume.csv", index=False, encoding="utf-8")