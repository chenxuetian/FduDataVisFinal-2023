from models import Model
import numpy as np
from tqdm import trange
import pickle


interval = 1
model = Model(interval)

start_ts = 1681340400
end_ts = 1681372800
total_ts_minute = np.arange(start_ts, end_ts+60, 60, dtype=np.int32)

xMin = -447
xMax = 402
yMin = -636
yMax = 90
grid_size = 3
num_grids_x = (xMax - xMin) // grid_size
num_grids_y = (yMax - yMin) // grid_size

n = 0
cur_ts = start_ts
ts2matrix = {}
matrix = np.zeros((num_grids_x, num_grids_y), dtype=np.uint16)
start = end = 0
for i in trange(len(total_ts_minute)):
    cur_ts = total_ts_minute[i]
    if i == 0:
        start = end = cur_ts
    else:
        start = end + interval
        end += 60
    for pos in model.time_data.loc[start:end, "position"].to_list():
        index_x = int((pos["x"] - xMin) / grid_size)
        index_y = int((pos["y"] - yMin) / grid_size)
        matrix[index_x, index_y] += 1
        n += 1
    ts2matrix[cur_ts] = matrix.copy()
print(f"Done. There are {n} records.")

with open("data_heatmap.pkl", "wb") as f:
    pickle.dump(ts2matrix, f)
# with open("data_heatmap.pkl", "rb") as f:
#     ts2matrix2 = pickle.load(f)


# matrix2 = np.zeros((num_grids_x, num_grids_y), dtype=np.uint16)
# for pos in model.time_data.loc[start_ts+7260+interval:end_ts-3600*3, "position"].to_list():
#     index_x = int((pos["x"] - xMin) / grid_size)
#     index_y = int((pos["y"] - yMin) / grid_size)
#     matrix2[index_x, index_y] += 1
# assert (matrix2 == (ts2matrix2[end_ts-3600*3] - ts2matrix2[start_ts+7260])).all()
