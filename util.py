import os
import json
import pickle
from collections import defaultdict
from tqdm import tqdm


def align_timestamp(timestamp, interval):
    return round(timestamp / (interval * 1e6)) / (1 / interval)


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
    return all_records