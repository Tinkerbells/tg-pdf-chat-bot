from flask import Flask, jsonify, request
from flask_cors import CORS
from flask import request
import whisper

app = Flask(__name__)
CORS(app)

model = whisper.load_model("base")

@app.route('/get_transcription', methods=['POST'])

def get_transcription():
    file_path = request.json.get("file_path")
    result = model.transcribe(file_path)
    return jsonify({"text": result["text"]})

if __name__ == "__main__":
  app.run(debug = False)
