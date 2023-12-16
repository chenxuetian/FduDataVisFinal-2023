import os
import json
import util
import datetime


data_dir = "data/1.3_traffic"
id_dir = "merged_data_ids/1.3_traffic/"


class Model:
    types = {
        -1: "未知",
        1: "小型车辆",
        2: "行人",
        3: "非机动车",
        4: "卡车",
        5: "厢式货车、面包车",
        6: "客车",
        7: "静态物体",
        8: "路牙",
        9: "锥桶",
        10: "手推车、三轮车",
        11: "信号灯",
        12: "出入口"
    }
    used_types = ["小型车辆", "行人", "非机动车", "卡车", "客车", "手推车、三轮车"]
    def __init__(self):
        print("Read data...")

        self.time_data = util.read_data_pandas(data_dir, id_dir, 5)
        
        self.map_data = []
        for road in ["boundary", "crosswalk", "lane", "signal", "stopline"]:
            with open(os.path.join(data_dir, "road2-12-9road", f"{road}road_with9road.geojson")) as f:
                self.map_data.append(json.load(f)) 
        
        with open("vehicles_lane_data.json") as f:
            self.record_data = json.load(f)
        
        with open("data_volume.json", encoding="utf-8") as f:
            self.volume_data = json.load(f)

        print("Data prepared.")

    def get_data_by_ts(self, ts):
        return self.time_data.loc[ts:ts+55].groupby("time_meas").apply(lambda group: group.to_dict(orient='records')).to_dict()