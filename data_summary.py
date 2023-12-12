import os
import pdb
import json
import numpy as np
from tqdm import tqdm
import matplotlib.pyplot as plt

from util import *

ATTR = ["id","seq","is_moving","position","shape","orientation","velocity","type","heading","time_meas","ms_no"]

def load_data(path, max_num=-1):
    data = []
    with open(path, "r") as f:
        for idx, line in tqdm(enumerate(f.readlines())):
            rec = json.loads(line)
            rec["position"] = json.loads(rec["position"])
            rec["shape"] = json.loads(rec["shape"])
            data.append(rec)
            if max_num > 0 and idx >= max_num:
                break
    return data


def combine_data_in_second(data,
                           time_int="5s"):
    
    print("Combining data ...")
    if time_int == "1s":
        time_div = 1000000
    elif time_int == "2s":
        time_div = 2000000
    elif time_int == "5s":
        time_div = 5000000
    
    def combine_multi_recs(recs):
        
        time_stamp = recs[0]["time_meas"] // time_div
        for rec in recs:
            assert rec["time_meas"] // time_div == time_stamp
        
        combined_rec = {attr: [] for attr in ATTR}
        for rec in recs:
            for attr in ATTR:
                combined_rec[attr].append(rec[attr])
        
        # Combine the data.
        combined_rec["id"] = combined_rec["id"][0]     # All ids are the same.
        combined_rec["seq"] = combined_rec["seq"][0]   # Seq is not important.
        combined_rec["is_moving"] = int(sum(combined_rec["is_moving"]) > 0) 
        _position = {'x':0, 'y':0}   # We don't need "z".
        for coord in ['x', 'y']:
            _position[coord] = np.mean(np.array([pos_rec[coord] for pos_rec in combined_rec["position"]]))
        combined_rec["position"] = _position
        combined_rec["shape"] = combined_rec["shape"][0]
        combined_rec["orientation"] = np.mean(np.array(combined_rec["orientation"]))
        combined_rec["velocity"] = np.mean(np.array(combined_rec["velocity"]))
        combined_rec["type"] = max(set(combined_rec["type"]), key=combined_rec["type"].count)
        combined_rec["heading"] = np.mean(np.array(combined_rec["heading"]))
        combined_rec["time_meas"] = combined_rec["time_meas"][0] // time_div
        combined_rec["ms_no"] = combined_rec["ms_no"][0]   # ms_no is not important.
        
        return combined_rec
        
    
    total_time_stamp = sorted(list(set([rec["time_meas"] for rec in data])))
    min_time_stamp, max_time_stamp = total_time_stamp[0], total_time_stamp[-1]
    min_time_stamp, max_time_stamp = min_time_stamp // time_div, max_time_stamp // time_div
    time_range = list(range(min_time_stamp, max_time_stamp+1))
    
    # Divided records into different time intervals.
    combined_data = {time: [] for time in time_range}
    for rec in data:
        time = rec["time_meas"] // time_div
        combined_data[time].append(rec)
        
    # Handle the repeated data in each time intervals.
    new_combined_data = {time: [] for time in time_range}
    for time, inter_data in tqdm(combined_data.items()):
        new_inter_data = []
        # Get all ids.
        id_list = list(set([rec["id"] for rec in inter_data]))
        for id in id_list:
            id_recs = []
            for inter_rec in inter_data:
                if inter_rec["id"] == id:
                    id_recs.append(inter_rec)
            id_combined_rec = combine_multi_recs(id_recs)
            new_inter_data.append(id_combined_rec)
        new_combined_data[time] = new_inter_data
        
    return new_combined_data


def save_data(data,
              path):
    with open(path, "w") as f:
        json.dump(data, f)
        
        
def calibrate_time_stamp(data, interval=2):
    
    new_data = {}
    for rec in data:
        time = int(rec["time_meas"] / (interval * 1e6))
        if time in new_data.keys():
            new_data[time].append(rec)
        else:
            new_data[time] = [rec]
            
    return new_data
        


if __name__ == '__main__':
    
    data_dir = "./Data/Task1.3"
    # json_list = [f_name for f_name in os.listdir(data_dir) if f_name.endswith(".json")]
    # data = []
    # for json_f in json_list:
    #     _data = load_data(os.path.join(data_dir, json_f), max_num=10000)
    #     data.extend(_data)
    
    # new_data = combine_data_in_second(data, time_int="5s")
    # merge_records(data_dir, id_dir="./merged_data_ids/1.3_traffic/", intervals=[.5, 1, 2, 5, 10])
    new_data = calibrate_time_stamp(read_data(data_dir, id_dir="./merged_data_ids/1.3_traffic/", interval=2), interval=2)
    new_data = {key: value for idx, (key, value) in enumerate(new_data.items()) if idx < 20}
    save_path = os.path.join("data.json")
    
    save_data(new_data, save_path)

    pdb.set_trace()