import psycopg2
from psycopg2.extras import RealDictCursor

CONNECTION = "postgres://tsdbadmin:im0samw2z9znk6wx@ye2k1c2vo8.hqdaauvzv5.tsdb.cloud.timescale.com:30484/tsdb?sslmode=require"

def main():
    try:
        conn = psycopg2.connect(CONNECTION)
        print("Successfully connected to TimescaleDB")
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check extensions
        cur.execute("select extname, extversion from pg_extension")
        extensions = cur.fetchall()
        print("\nInstalled PostgreSQL Extensions:")
        for extension in extensions:
            print(f"Extension: {extension['extname']}, Version: {extension['extversion']}")
        
        # Check TimescaleDB specific information
        cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'")
        timescale_version = cur.fetchone()
        if timescale_version:
            print(f"\nTimescaleDB Version: {timescale_version['extversion']}")
        
        # Check hypertables
        cur.execute("""
            SELECT hypertable_name
            FROM timescaledb_information.hypertables
        """)
        hypertables = cur.fetchall()
        if hypertables:
            print("\nHypertables:")
            for table in hypertables:
                print(f"Table: {table['hypertable_name']}")
        else:
            print("\nNo hypertables found")
        
        # List all tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        if tables:
            print("\nAll Tables in public schema:")
            for table in tables:
                print(f"Table: {table['table_name']}")
        
        cur.close()
        conn.close()
        print("\nConnection closed successfully")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 