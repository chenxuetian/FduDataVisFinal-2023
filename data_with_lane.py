import pandas as pd
import geopandas as gpd
from shapely.geometry import LineString,Point
import json

road_data_gdf = gpd.read_file('road2-12-9road\laneroad_with9road.geojson')
with open('data.json', 'r') as file:
    vehicles_data = json.load(file)

# import pdb;pdb.set_trace()


# buffer_distance = 2 

# road_data_gdf['buffered_geometry'] = road_data_gdf.geometry.buffer(buffer_distance)

for key in vehicles_data.keys(): 
    vehicles_list = vehicles_data[key]
    vehicles_df = pd.DataFrame(vehicles_list)

    vehicles_df['geometry'] = vehicles_df.apply(lambda row: Point(row['position']['x'], row['position']['y']), axis=1)
    vehicles_gdf = gpd.GeoDataFrame(vehicles_df, geometry='geometry')

    for index, vehicle in vehicles_gdf.iterrows():
        # 计算车辆与所有道路中心线的最小距离
        min_distance = float('inf')
        nearest_lane_fid = None
        for _, road in road_data_gdf.iterrows():
            distance = vehicle.geometry.distance(road.geometry)
            if distance < min_distance:
                min_distance = distance
                nearest_lane_fid = road.fid
        vehicles_data[key][index]['nearest_lane_fid'] = nearest_lane_fid
        vehicles_data[key][index]['distance_to_nearest_lane_fid'] = min_distance

        if vehicles_data[key][index]["type"] in [1,3,4,5,6,10]:
            vehicles_data[key][index]['is_vehicle'] = True
        else:
            vehicles_data[key][index]['is_vehicle'] = False
            
    
    # # 分配最近的车道fid
    # vehicles_gdf.at[index, 'nearest_lane_fid'] = nearest_lane_fid
    # for index, vehicle in vehicles_gdf.iterrows():
    #     # 使用缓冲区来检查
    #     vehicle_lane = road_data_gdf[road_data_gdf.buffered_geometry.contains(vehicle.geometry)].fid
    #     if not vehicle_lane.empty:
    #         vehicles_data[key][index]['lane_fid'] = int(vehicle_lane.iloc[0])
    #         print(list(vehicle_lane))
    #     else:
    #         vehicles_data[key][index]['lane_fid'] = None
with open('vehicles_lane_data.json', 'w') as outfile:
    json.dump(vehicles_data, outfile,indent=4)