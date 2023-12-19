import pandas as pd
import geopandas as gpd
from shapely.geometry import LineString,Point
import json

data_dir="data/1.3_traffic/"
id_dir = "merge_data_ids/1.3_traffic/"


road_data_gdf = gpd.read_file(r'data\\1.3_traffic\\road2-12-9road\\laneroad_with9road.geojson')

for i in range(10):
    with open(r'data\\1.3_traffic\\part-0000'+str(i)+'-f54e552a-6c3d-4dc3-bb38-550e2f491b47-c000.json', 'r') as file:
        vehicles_data = json.load(file)


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

    with open('match_lane_data\data'+str(i)+'.json', 'w') as outfile:
        json.dump(vehicles_data, outfile,indent=4)