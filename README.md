![placeholder](https://github.com/DanielBash/hell-0/blob/main/.github/github-banner.png?raw=true)
![Python](https://img.shields.io/badge/python-3.12%2B-blue)
![Stars](https://img.shields.io/github/stars/DanielBash/bloomboom_io)

# boombloom.io

> The garden is for the strongest

Destroy other flowers, and compete, working on your unique tactic. Remember:
![greet_bunner](https://64.media.tumblr.com/0d97358862fa7536a63b129206129648/tumblr_nyu56eazGN1umsmpio1_r1_540.png)

## Local setup
### Case 1: Venv

1) Download the repo.
```bash
git clone https://github.com/DanielBash/bloomboom_io.git
cd bloomboom_io
```

2) Install python reqs.
```bash
pip install -r requirements.txt
```

3) Change settings in .env if necessary <br/>
```bash
touch .env
echo "SECRET_KEY=secure-secret-key" > .env
```

#### Case 1.1: Run the dev server
```bash
python main.py
```

#### Case 1.2: Run the production server
```bash
gunicorn --config gunicorn_config.py main:app
```