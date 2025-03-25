import psycopg2
from psycopg2.extras import RealDictCursor

CONNECTION = "postgres://tsdbadmin:im0samw2z9znk6wx@ye2k1c2vo8.hqdaauvzv5.tsdb.cloud.timescale.com:30484/tsdb?sslmode=require"

def create_post_metrics():
    try:
        conn = psycopg2.connect(CONNECTION)
        print("Successfully connected to TimescaleDB")
        
        cur = conn.cursor()
        
        # Create the post_metrics table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS post_metrics (
                time TIMESTAMPTZ NOT NULL,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                shares INTEGER DEFAULT 0
            );
        """)
        print("\nTable 'post_metrics' created or already exists")
        
        # Convert to hypertable
        cur.execute("""
            SELECT create_hypertable('post_metrics', 'time', 
                                   if_not_exists => TRUE,
                                   migrate_data => TRUE);
        """)
        print("Converted to hypertable")
        
        # Create indexes for better query performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_post_metrics_post_id ON post_metrics (post_id);
            CREATE INDEX IF NOT EXISTS idx_post_metrics_user_id ON post_metrics (user_id);
        """)
        print("Created indexes")
        
        # Add some sample data
        cur.execute("""
            INSERT INTO post_metrics (time, post_id, user_id, views, likes, comments, shares)
            VALUES 
                (NOW(), 'post1', 'user1', 100, 10, 5, 2),
                (NOW() - INTERVAL '1 hour', 'post1', 'user1', 50, 5, 2, 1),
                (NOW() - INTERVAL '2 hours', 'post2', 'user2', 200, 20, 8, 3),
                (NOW() - INTERVAL '3 hours', 'post2', 'user2', 150, 15, 6, 2);
        """)
        print("Added sample data")
        
        # Commit the changes
        conn.commit()
        
        # Verify the hypertable was created
        cur.execute("""
            SELECT hypertable_name
            FROM timescaledb_information.hypertables
            WHERE hypertable_name = 'post_metrics';
        """)
        result = cur.fetchone()
        if result:
            print("\nHypertable 'post_metrics' created successfully!")
            
            # Show sample query
            cur.execute("""
                SELECT 
                    post_id,
                    time_bucket('1 hour', time) as hourly,
                    SUM(views) as total_views,
                    SUM(likes) as total_likes,
                    SUM(comments) as total_comments,
                    SUM(shares) as total_shares
                FROM post_metrics
                GROUP BY post_id, hourly
                ORDER BY hourly DESC;
            """)
            metrics = cur.fetchall()
            print("\nSample hourly metrics:")
            for row in metrics:
                print(f"Post: {row[0]}, Hour: {row[1]}, Views: {row[2]}, Likes: {row[3]}, Comments: {row[4]}, Shares: {row[5]}")
        
        cur.close()
        conn.close()
        print("\nConnection closed successfully")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    create_post_metrics() 