#!/usr/bin/env python3

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

class MockGemmaPilotHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "healthy", "message": "Mock GemmaPilot backend is running"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            data = {}
        
        if self.path == '/chat':
            prompt = data.get('prompt', '')
            response = {
                "response": f"Mock response to: '{prompt}'. This is a demo response from the mock backend!"
            }
        elif self.path == '/complete':
            prompt = data.get('prompt', '')
            context = data.get('context', '')
            response = {
                "completion": f"// Mock completion for: {prompt}\nconsole.log('Hello from GemmaPilot!');"
            }
        else:
            response = {"error": "Unknown endpoint"}
        
        self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), MockGemmaPilotHandler)
    print("🚀 Mock GemmaPilot backend server running on http://localhost:8000")
    print("📚 Available endpoints:")
    print("   GET  /health - Health check")
    print("   POST /chat - Chat with AI")
    print("   POST /complete - Code completion")
    print("\n🔄 Press Ctrl+C to stop the server")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
        server.shutdown()
