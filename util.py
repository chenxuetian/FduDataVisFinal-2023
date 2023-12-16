import os
import json
import pickle
import numpy as np
import pandas as pd
from tqdm import tqdm
from collections import defaultdict


def align_timestamp(timestamp, interval):
    ats = round(timestamp / (interval * 1e6)) / (1 / interval)
    if interval > 1:
        ats = int(ats)
    return ats


def merge_records(data_dir, id_dir, intervals):
    data_files = sorted([os.path.join(data_dir, fname) for fname in os.listdir(data_dir) if fname.endswith(".json")])
    all_records_vid_ts = []
    for data_file in data_files:
        records = []
        with open(data_file) as f:
            while line := f.readline():
                records.append(json.loads(line))
        
        records_vid_ts = [(record["id"], record["time_meas"]) for record in records]
        all_records_vid_ts.append(records_vid_ts)
        del records
    
    if not isinstance(intervals, list):
        intervals = [intervals]
    
    for interval in intervals:
        rec_is_sel = [bytearray([0 for _ in range(len(f_record))]) for f_record in all_records_vid_ts]
        ts2rec = defaultdict(dict)
        n_drop = 0
        for fid, records_vid_ts in enumerate(all_records_vid_ts):
            for lid, (vid, ts) in enumerate(records_vid_ts):
                ats = align_timestamp(ts, interval)
                if vid in ts2rec[ats]:
                    n_drop += 1
                    pfid, plid, pts = ts2rec[ats][vid]
                    if ts < pts:
                        ts2rec[ats][vid] = (fid, lid, ts)
                        rec_is_sel[fid][lid] = 1
                        rec_is_sel[pfid][plid] = 0
                else:
                    ts2rec[ats][vid] = (fid, lid, ts)
                    rec_is_sel[fid][lid] = 1
        print(f"Time interval: {interval}s\n\t{n_drop} records are dropped in the mergence. {sum(sum(f_sel) for f_sel in rec_is_sel)} records remains.")
        
        if not os.path.exists(id_dir):
            os.makedirs(id_dir)
        stored_fname = os.path.join(id_dir, f"mdata_{interval}.pkl")
        with open(stored_fname, "wb") as f:
            pickle.dump(rec_is_sel, f)
        print(f"\tSelected ids are stored in ./{stored_fname}.")


def read_data(data_dir, id_dir=None, interval=None):
    if id_dir and interval:
        assert os.path.exists(os.path.join(id_dir, f"mdata_{interval}.pkl")), f"Merged_data_id file with interval {interval}s does not exist!"
        with open(os.path.join(id_dir, f"mdata_{interval}.pkl"), 'rb') as f:
            selected = pickle.load(f)
    else:
        selected = None
    
    data_files = sorted([os.path.join(data_dir, fname) for fname in os.listdir(data_dir) if fname.endswith(".json")])
    all_records = []
    for fid, data_file in enumerate(data_files):
        records = []
        lid = 0
        with open(data_file) as f:
            while line := f.readline():
                if selected and selected[fid][lid]:
                    rec = (json.loads(line))
                    rec["position"] = json.loads(rec["position"])
                    rec["shape"] = json.loads(rec["shape"])    
                    records.append(rec)                    
                lid += 1
        all_records.extend(records)

    print(f"Successfully read {len(all_records)} records.")
    df = pd.DataFrame(all_records)
    del all_records
    return df

def read_data_pandas(data_dir, id_dir, interval):
    assert os.path.exists(os.path.join(id_dir, f"mdata_{interval}.pkl")), f"Merged_data_id file with interval {interval}s does not exist!"
    with open(os.path.join(id_dir, f"mdata_{interval}.pkl"), 'rb') as f:
        selected = pickle.load(f)
    num_records = sum(sum(f_selected) for f_selected in selected)

    data_files = sorted([os.path.join(data_dir, fname) for fname in os.listdir(data_dir) if fname.endswith(".json")])
    all_records = []
    with tqdm(total=num_records) as pbar:
        for fid, data_file in enumerate(data_files):
            lid = 0
            with open(data_file) as f:
                while line := f.readline():
                    if selected and selected[fid][lid]:
                        record = json.loads(line)
                        record["time_meas"] = align_timestamp(record["time_meas"], interval)
                        record.pop("seq")
                        record.pop("ms_no")
                        record["position"] = json.loads(record["position"])
                        record["shape"] = json.loads(record["shape"])
                        all_records.append(record)
                        pbar.update()              
                    lid += 1
    assert len(all_records) == num_records
    print(f"Successfully read {num_records} records.")
    dtypes = {
        'id': np.int32, 
        'is_moving': np.int8, 
        'position': np.object_, 
        'shape': np.object_, 
        'orientation': np.float32, 
        'velocity': np.float32,
        'type': np.int8, 
        'heading': np.float32,
        "time_meas": np.int32
    }
    df = pd.DataFrame(all_records).astype(dtypes).set_index("time_meas").sort_index()
    return df


def add_records(data_dir, interval):
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
    data_files = sorted([os.path.join(data_dir, fname) for fname in os.listdir(data_dir) if fname.endswith(".json")])
    time_type2vids = defaultdict(lambda: defaultdict(set))
    for data_file in tqdm(data_files):
        with open(data_file) as f:
            while line := f.readline():
                record = json.loads(line)
                ats = align_timestamp(record["time_meas"], interval)
                vtype = record["type"]
                vid = record["id"]
                time_type2vids[ats][vtype].add(vid)
    records = []
    for ats, vtype2vids in sorted(time_type2vids.items()):
        record = {"time": ats} | {types[vtype]: len(vids) for vtype, vids in vtype2vids.items() if vtype not in {-1, 5, 7, 8, 9, 11, 12}}
        records.append(record)
    return records