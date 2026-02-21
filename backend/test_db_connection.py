import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5433,
        database="insightloop_db",
        user="insightloop",
        password="dev_password"
    )
    print("✓ Connection successful!")
    conn.close()
except Exception as e:
    print(f"✗ Connection failed: {e}")
