# -*- coding: UTF-8 -*-
import os
import json
import flask
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

@app.route('/get_volume_data', methods=["GET"])
def get_volume_data():
    return json.dumps({"types": model.used_types, "data": model.volume_data})

@app.route('/get_init_map_data', methods=["GET"])
def get_init_map_data():
    init_time = model.time_data.index.min()
    init_records = model.get_data_by_ts(init_time)
    return json.dumps({"map_data": model.map_data, "cache_data": init_records})

@app.route('/get_record_data', methods=["GET"])
def get_record_data():
    return json.dumps(model.record_data)


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5100, use_reloader=True, debug=True)
