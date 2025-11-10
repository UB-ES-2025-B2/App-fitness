Test suite for App-fitness

How to run

1. Install test dependencies (recommended in a virtualenv):

   pip install pytest

2. Run tests from the project root (App-fitness):

   pytest -q

Notes

- The tests in this folder exercise the backend Flask app located in backend/app.
- Tests create an in-memory SQLite database so they are isolated and do not modify your development database.
- If you add endpoints that require external services, mock them in new tests or extend the fixtures in test/conftest.py.

Adding new tests

- Create a new file starting with test_ and place it in the test/ folder.
- Use the provided fixtures `client` and `_db` from `conftest.py`.
- Add comments at the top of the test file indicating the User Story (US) and the Acceptance Criteria covered.
