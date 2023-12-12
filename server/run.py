# -*- coding: UTF-8 -*-
import os
import json
from flask import Flask, jsonify
from flask_cors import CORS


app = Flask(__name__)

# flask_cors: Cross Origin Resource Sharing (CORS), making cross-origin AJAX possible.
CORS(app)

print("================================================================")

@app.route('/', methods=["GET"])
def _get():
    return jsonify("Hello world!")

@app.route('/get_example_data', methods=["GET"])
def _get_example_data():
    map_data_path = "data/1.3_traffic/road2-12-9road"
    map_data = []
    for road in ["boundary", "crosswalk", "lane", "signal", "stopline"]:
        with open(os.path.join(map_data_path, f"{road}road_with9road.geojson")) as f:
            map_data.append(json.load(f)) 
    with open("data.json") as f:
            record_data = json.load(f)
    all_data = {"map_data": map_data, "record_data": record_data}
    return all_data


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5400, use_reloader=True, debug=True)
