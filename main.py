from bottle import Bottle, run, template, static_file, request, response
import requests

import json

app = Bottle()

@app.route('/')
def index():
    return "Index, do not do plz."

@app.route('/api/servers')
def get_all_servers():
    response.content_type = 'application/json'
    return requests.get("http://127.0.0.1:31337/server/all").json()

if __name__ == '__main__':
    run(app, host="localhost", port=3001, reloader=True)

