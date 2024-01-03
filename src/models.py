import os
import json
import pickle
import pandas as pd
from scipy.sparse import coo_matrix

import src.util as util


data_dir = "data/1.3_traffic"
id_dir = "merged_data_ids/1.3_traffic/"
pdata_dir = "static/data"

# merge records
if not os.path.exists(id_dir):
    print("Merging records for first time configuration...")
    util.merge_records(data_dir, id_dir, [0.5, 1, 2, 5, 10])


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
    def __init__(self, interval):
        print("Read data...")

        self.interval = interval
        self.time_data = util.read_data(data_dir, id_dir, interval)
        time_index = self.time_data.index.get_level_values("time_meas")
        self.time_range = [time_index.min(), time_index.max()]
        
        self.map_grid_size = 3
        self.map_margin = {"x_min":-447, "x_max": 402, "y_min": -636, "y_max": 90}
        self.map_data = []
        for road in ["boundary", "crosswalk", "lane", "signal", "stopline"]:
            with open(os.path.join(data_dir, "road2-12-9road", f"{road}road_with9road.geojson")) as f:
                self.map_data.append(json.load(f)) 
        
        self.volume_data = pd.read_csv(os.path.join(pdata_dir, "data_volume.csv")).to_dict(orient="records")

        with open(os.path.join(pdata_dir, "data_heatmap.pkl"), "rb") as f:
            self.heatmap_data = pickle.load(f)

        with open(os.path.join(pdata_dir, "data_jam_10_processed.json"),encoding='UTF-8') as f:
            self.jamfig_data = json.load(f)

        # self.cluster_types = pd.read_csv(os.path.join(pdata_dir, "stats_with_cluster_types.csv")).to_dict(orient="records")
        # self.grouped_stats = pd.read_csv(os.path.join(pdata_dir, "grouped_stats.csv")).to_dict(orient="records")

        with open(os.path.join(pdata_dir, "allData.json"),encoding='UTF-8') as f:
            self.cluster_types = json.load(f)
        with open(os.path.join(pdata_dir, "groupedData.json"),encoding='UTF-8') as f:
            self.grouped_stats = json.load(f)

        print("Data prepared.")

    def get_data_by_ts(self, ts):
        return self.time_data.loc[ts:ts+60-self.interval].reset_index("id").groupby("time_meas").apply(lambda group: group.to_dict(orient='records')).to_dict()

    def get_data_by_id(self, vid):
        return self.time_data.loc[(slice(None), vid), :].reset_index("time_meas").to_dict(orient='records')
    
    def get_heatmap_data_by_ts(self, ts0, ts1, init):
        if init:
            smatrix = coo_matrix(self.heatmap_data[self.time_range[1]])
        else:
            smatrix = coo_matrix(self.heatmap_data[ts1] - self.heatmap_data[ts0])
        data = [
            {
                "v": int(d), 
                "x": int(r) * self.map_grid_size + self.map_margin["x_min"], 
                "y": int(c) * self.map_grid_size + self.map_margin["y_min"]
            } 
            for d, r, c in zip(smatrix.data, smatrix.row, smatrix.col)
        ]
        return data
