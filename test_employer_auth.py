"""Run after pip install -r requirements.txt: python test_employer_auth.py
Tests signup -> session -> logout -> login -> session with temporary data.
Does not change your actual employer accounts.
"""
import os
import sys
import json
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory(prefix='internmatch_auth_test_') as data_dir:
    os.environ['INTERNMATCH_DATA_DIR'] = data_dir
    os.environ.pop('INTERNMATCH_HTTPS', None)
    from backend import app
    app.config['TESTING'] = True
    client = app.test_client()
    user = {'company_name': 'Demo Test Company', 'contact_name': 'Demo Tester',
            'email': 'demo.auth.test@example.com', 'password': 'ValidPassword123'}
    response = client.post('/api/employer/register', json=user)
    assert response.status_code == 201, response.get_json()
    assert client.get('/api/employer/me').status_code == 200, 'Session missing after signup'
    assert client.post('/api/employer/logout').status_code == 200
    assert client.get('/api/employer/me').status_code == 401
    response = client.post('/api/employer/login', json={'email':user['email'],'password':user['password']})
    assert response.status_code == 200, response.get_json()
    assert client.get('/api/employer/me').status_code == 200, 'Session missing after login'
    assert client.get('/api/employer/session-status').get_json()['authenticated'] is True
    saved = json.loads((Path(data_dir)/'employers.json').read_text(encoding='utf-8'))
    assert saved[0]['email'] == user['email']
    assert saved[0]['password_hash'] != user['password']
    print('PASS: Employer register -> session -> logout -> login -> session -> persistent hash')
