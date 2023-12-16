import json
import util

data_dir = "data/1.3_traffic/"

interval = 300
records = util.add_records(data_dir, interval)

with open("data_volfig.json", "w") as f:
    json.dump(records, f, ensure_ascii=False)