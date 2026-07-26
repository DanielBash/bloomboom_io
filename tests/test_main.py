"""Testing integrity of the main blueprint."""


# - check weather homepage is loading
def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200
