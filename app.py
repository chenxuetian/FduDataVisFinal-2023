# -*- coding: UTF-8 -*-
import os
import json
import flask
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from models import Model


app = Flask(__name__)

# flask_cors: Cross Origin Resource Sharing (CORS), making cross-origin AJAX possible.
CORS(app)

model = Model(10)
print("================================================================")

@app.route('/', methods=["GET"])
def _get():
    return flask.render_template("main.html")

@app.route("/get_data_by_ts", methods=["GET"])
def get_data_by_ts():
    ts = int(request.args.get('ts', -1))
    return json.dumps(model.get_data_by_ts(ts))

@app.route("/get_pos_data_by_two_ts", methods=["GET"])
def get_pos_data_by_two_ts():
    ts0 = int(request.args.get('ts0', -1))
    ts1 = int(request.args.get('ts1', -1))
    return json.dumps(model.get_pos_data_by_two_ts(ts0, ts1))

@app.route('/get_volume_data', methods=["GET"])
def get_volume_data():
    return json.dumps({"types": model.used_types, "data": model.volume_data})

@app.route('/get_init_map_data', methods=["GET"])
def get_init_map_data():
    init_time = model.time_data.index.min()
    init_records = model.get_data_by_ts(init_time)
    return json.dumps({"map_data": model.map_data, "cache_data": init_records})

@app.route('/get_jamfig_data', methods=["GET"])
def get_jamfig_data():
    with open("data_jam_10_processed.json",encoding='UTF-8') as f:
        jamfig_data = json.load(f)
    return json.dumps(jamfig_data)

@app.route('/get_record_data', methods=["GET"])
def get_record_data():
    return json.dumps(model.record_data)

@app.route('/get_cluster_data', methods=["GET"])
def get_cluster_data():
    df1 = pd.read_csv('static/csv/stats_with_cluster_types.csv', sep=",")
    df2 = pd.read_csv('static/csv/grouped_stats.csv', sep=",")
    return json.dumps([df1.loc[:].to_dict(orient="records"), df2.loc[:].to_dict(orient="records")])

@app.route("/get_heatmap_data")
def get_heatmap_data():
    init = request.args.get('init', "False") == "True"
    ts0 = int(request.args.get('ts0', -1))
    ts1 = int(request.args.get('ts1', -1))
    return json.dumps(model.get_heatmap_data_by_ts(ts0, ts1, init))


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5100, use_reloader=True, debug=True)
