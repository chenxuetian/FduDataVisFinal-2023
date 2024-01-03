# -*- coding: UTF-8 -*-
import os
import json
import flask
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from src.models import Model


app = Flask(__name__)

# flask_cors: Cross Origin Resource Sharing (CORS), making cross-origin AJAX possible.
CORS(app)

interval = 10
model = Model(interval)
print("================================================================")

@app.route('/', methods=["GET"])
def _get():
    return flask.render_template("main.html")

@app.route("/get_data_by_ts", methods=["GET"])
def get_data_by_ts():
    ts = int(request.args.get('ts', -1))
    return json.dumps(model.get_data_by_ts(ts))

@app.route("/get_data_by_id", methods=["GET"])
def get_data_by_id():
    vid = int(request.args.get('id', -1))
    return json.dumps(model.get_data_by_id(vid))

@app.route('/get_volume_data', methods=["GET"])
def get_volume_data():
    return json.dumps({"types": model.used_types, "data": model.volume_data})

@app.route('/get_init_map_data', methods=["GET"])
def get_init_map_data():
    init_time = model.time_range[0]
    init_records = model.get_data_by_ts(init_time)
    return json.dumps({"map_data": model.map_data, "cache_data": init_records})

@app.route('/get_jamfig_data', methods=["GET"])
def get_jamfig_data():
    return json.dumps(model.jamfig_data)

@app.route('/get_cluster_data', methods=["GET"])
def get_cluster_data():
    return json.dumps([model.cluster_types, model.grouped_stats])

@app.route("/get_heatmap_data_by_ts")
def get_heatmap_data_by_ts():
    init = request.args.get('init', "False") == "True"
    ts0 = int(request.args.get('ts0', -1))
    ts1 = int(request.args.get('ts1', -1))
    return json.dumps(model.get_heatmap_data_by_ts(ts0, ts1, init))


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5100, use_reloader=False, debug=False)
