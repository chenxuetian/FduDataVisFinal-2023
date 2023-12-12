# -*- coding: UTF-8 -*-
import os
import json
import flask
from flask import Flask, jsonify
from flask_cors import CORS


app = Flask(__name__)

# flask_cors: Cross Origin Resource Sharing (CORS), making cross-origin AJAX possible.
CORS(app)

print("================================================================")

@app.route('/', methods=["GET"])
def _get():
    return flask.render_template("main.html")

@app.route('/get_map_data', methods=["GET"])
def get_map_data():
    map_data_path = "data/1.3_traffic/road2-12-9road"
    map_data = []
    for road in ["boundary", "crosswalk", "lane", "signal", "stopline"]:
        with open(os.path.join(map_data_path, f"{road}road_with9road.geojson")) as f:
            map_data.append(json.load(f)) 
    return jsonify(map_data)

@app.route('/get_record_data', methods=["GET"])
def get_record_data():
    with open("vehicles_lane_data.json") as f:
        record_data = json.load(f)
    return jsonify(record_data)


if __name__ == "__main__":
    app.run(host='10.222.148.31', port=5400, use_reloader=True, debug=True)
