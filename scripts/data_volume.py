import util
import pandas as pd

data_dir = "data/1.3_traffic/"

interval = 300
records = util.add_records(data_dir, interval)
pd.DataFrame(records).to_csv("data_volume.csv", index=False, encoding="utf-8")