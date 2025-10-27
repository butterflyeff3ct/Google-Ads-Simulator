"""
Database Service Layer for Google Ads Simulator
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import json

from app.models import User, UserActivity, Campaign, Simulation, KeywordData, AccessRequest
from app.database import get_db_session

class UserService:
    """Service for user-related database operations"""
    
    @staticmethod
    def create_user(
        email: str,
        name: str,
        provider: str,
        profile_pic: Optional[str] = None,
        db: Session = None
    ) -> dict:
        """Create a new user"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        # Use pyodbc directly to avoid SQLAlchemy issues
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            # Check if user already exists
            cursor.execute("SELECT id, email, name FROM users WHERE email = ?", email)
            existing_user = cursor.fetchone()
            
            if existing_user:
                conn.close()
                return {
                    "id": existing_user[0],
                    "email": existing_user[1],
                    "name": existing_user[2]
                }
            
            # Create new user
            user_id = str(uuid.uuid4())
            current_time = datetime.utcnow()
            
            cursor.execute("""
                INSERT INTO users (id, email, name, provider, profile_pic, status, 
                                 signup_timestamp, first_login, last_login, approval_date, 
                                 reapply_count, added_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, user_id, email, name, provider, profile_pic, 'active',
                current_time, current_time, current_time, current_time, 0, 'system')
            
            conn.close()
            
            return {
                "id": user_id,
                "email": email,
                "name": name,
                "provider": provider,
                "profile_pic": profile_pic
            }
            
        except Exception as e:
            conn.close()
            raise e
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT id, email, name, provider, profile_pic, status FROM users WHERE email = ?", email)
            user = cursor.fetchone()
            
            if user:
                return {
                    "id": user[0],
                    "email": user[1],
                    "name": user[2],
                    "provider": user[3],
                    "profile_pic": user[4],
                    "status": user[5]
                }
            return None
            
        except Exception as e:
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID"""
        with get_db_session() as db:
            return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def update_user_login(user_id: str) -> Optional[User]:
        """Update user's last login time"""
        with get_db_session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                if not user.first_login:
                    user.first_login = datetime.utcnow()
                user.last_login = datetime.utcnow()
                db.commit()
                db.refresh(user)
            return user
    
    @staticmethod
    def get_all_users(limit: int = 100, offset: int = 0) -> List[dict]:
        """Get all users with pagination and real-time status"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            # Get users with real-time status based on active sessions
            # A user is "online" ONLY if:
            # 1. They have a session with status = 'active' (not logged_out or expired)
            # 2. The session's last_activity was within the last 15 minutes
            # 3. The session has no logout_time (still logged in)
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.provider, u.profile_pic, 
                       CASE 
                           WHEN EXISTS (
                               SELECT 1 FROM user_activities ua 
                               WHERE ua.user_id = u.id 
                               AND ua.status = 'active'
                               AND ua.logout_time IS NULL
                               AND ua.last_activity > DATEADD(MINUTE, -15, GETUTCDATE())
                           ) THEN 'online'
                           ELSE u.status
                       END as status,
                       u.signup_timestamp, u.first_login, u.last_login, u.approval_date, 
                       u.denial_reason, u.reapply_count, u.added_by, u.notes
                FROM users u
                ORDER BY u.signup_timestamp DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """, offset, limit)
            
            users = []
            for row in cursor.fetchall():
                users.append({
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "provider": row[3],
                    "profile_pic": row[4],
                    "status": row[5],
                    "signup_timestamp": row[6],
                    "first_login": row[7],
                    "last_login": row[8],
                    "approval_date": row[9],
                    "denial_reason": row[10],
                    "reapply_count": row[11],
                    "added_by": row[12],
                    "notes": row[13]
                })
            
            return users
            
        except Exception as e:
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def update_user_status(user_id: str, status: str, notes: Optional[str] = None) -> Optional[User]:
        """Update user status"""
        with get_db_session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.status = status
                if notes:
                    user.notes = notes
                db.commit()
                db.refresh(user)
            return user

class UserActivityService:
    """Service for user activity-related database operations"""
    
    @staticmethod
    def create_activity(
        user_id: str,
        session_id: str,
        login_time: datetime,
        ip_address: Optional[str] = None
    ) -> dict:
        """Create a new user activity record"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            activity_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO user_activities (id, user_id, session_id, login_time, 
                                            ip_address, last_activity, status, 
                                            duration_mins, page_views, idle_timeout)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, activity_id, user_id, session_id, login_time, ip_address, 
                login_time, 'active', 0, 1, 15)
            
            conn.close()
            
            return {
                "id": activity_id,
                "user_id": user_id,
                "session_id": session_id,
                "login_time": login_time,
                "ip_address": ip_address,
                "last_activity": login_time
            }
            
        except Exception as e:
            conn.close()
            raise e
    
    @staticmethod
    def get_all_activities(limit: int = 100, offset: int = 0) -> List[dict]:
        """Get all user activities with pagination"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    ua.id,
                    ua.user_id,
                    u.email,
                    u.name,
                    ua.session_id,
                    ua.login_time,
                    ua.logout_time,
                    ua.ip_address,
                    ua.last_activity,
                    ua.status,
                    ua.duration_mins,
                    ua.page_views,
                    ua.idle_timeout
                FROM user_activities ua
                LEFT JOIN users u ON ua.user_id = u.id
                ORDER BY ua.login_time DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """, offset, limit)
            
            activities = []
            for row in cursor.fetchall():
                activities.append({
                    "id": row[0],
                    "user_id": row[1],
                    "email": row[2],
                    "name": row[3],
                    "session_id": row[4],
                    "login_time": row[5],
                    "logout_time": row[6],
                    "ip_address": row[7],
                    "last_activity": row[8],
                    "status": row[9],
                    "duration_mins": row[10],
                    "page_views": row[11],
                    "idle_timeout": row[12]
                })
            
            return activities
            
        except Exception as e:
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def update_activity(
        session_id: str,
        page_views: Optional[int] = None,
        actions_taken: Optional[List[str]] = None,
        status: Optional[str] = None,
        logout_time: Optional[datetime] = None
    ) -> Optional[UserActivity]:
        """Update user activity"""
        with get_db_session() as db:
            activity = db.query(UserActivity).filter(UserActivity.session_id == session_id).first()
            if activity:
                if page_views is not None:
                    activity.page_views = page_views
                if actions_taken is not None:
                    activity.actions_taken = actions_taken
                if status is not None:
                    activity.status = status
                if logout_time is not None:
                    activity.logout_time = logout_time
                    # Calculate duration
                    duration = logout_time - activity.login_time
                    activity.duration_mins = int(duration.total_seconds() / 60)
                
                activity.last_activity = datetime.utcnow()
                db.commit()
                db.refresh(activity)
            return activity
    
    @staticmethod
    def get_user_activities(user_id: str, limit: int = 50) -> List[UserActivity]:
        """Get user activities"""
        with get_db_session() as db:
            return db.query(UserActivity).filter(
                UserActivity.user_id == user_id
            ).order_by(desc(UserActivity.login_time)).limit(limit).all()
    
    @staticmethod
    def get_active_sessions() -> List[UserActivity]:
        """Get all active sessions"""
        with get_db_session() as db:
            return db.query(UserActivity).filter(
                UserActivity.status == "active"
            ).all()

class CampaignService:
    """Service for campaign-related database operations"""
    
    @staticmethod
    def create_campaign(
        user_id: str,
        name: str,
        daily_budget: float,
        campaign_type: str = "search",
        bidding_strategy: str = "manual_cpc",
        campaign_data: Optional[Dict[str, Any]] = None
    ) -> Campaign:
        """Create a new campaign"""
        with get_db_session() as db:
            campaign = Campaign(
                user_id=user_id,
                name=name,
                type=campaign_type,
                daily_budget=daily_budget,
                bidding_strategy=bidding_strategy,
                campaign_data=campaign_data
            )
            
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            return campaign
    
    @staticmethod
    def get_user_campaigns(user_id: str) -> List[Campaign]:
        """Get all campaigns for a user"""
        with get_db_session() as db:
            return db.query(Campaign).filter(Campaign.user_id == user_id).order_by(
                desc(Campaign.created_at)
            ).all()
    
    @staticmethod
    def get_campaign_by_id(campaign_id: str) -> Optional[Campaign]:
        """Get campaign by ID"""
        with get_db_session() as db:
            return db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    @staticmethod
    def update_campaign_status(campaign_id: str, status: str) -> Optional[Campaign]:
        """Update campaign status"""
        with get_db_session() as db:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = status
                campaign.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(campaign)
            return campaign

class SimulationService:
    """Service for simulation-related database operations"""
    
    @staticmethod
    def create_simulation(
        user_id: str,
        simulation_type: str = "auction",
        settings: Optional[Dict[str, Any]] = None,
        campaign_id: Optional[str] = None
    ) -> Simulation:
        """Create a new simulation"""
        with get_db_session() as db:
            simulation = Simulation(
                user_id=user_id,
                simulation_type=simulation_type,
                settings=settings,
                campaign_id=campaign_id
            )
            
            db.add(simulation)
            db.commit()
            db.refresh(simulation)
            return simulation
    
    @staticmethod
    def update_simulation_results(
        simulation_id: str,
        results: Dict[str, Any],
        status: str = "completed",
        execution_time_ms: Optional[int] = None
    ) -> Optional[Simulation]:
        """Update simulation with results"""
        with get_db_session() as db:
            simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()
            if simulation:
                simulation.results = results
                simulation.status = status
                simulation.completed_at = datetime.utcnow()
                if execution_time_ms is not None:
                    simulation.execution_time_ms = execution_time_ms
                db.commit()
                db.refresh(simulation)
            return simulation
    
    @staticmethod
    def get_user_simulations(user_id: str, limit: int = 20) -> List[Simulation]:
        """Get user simulations"""
        with get_db_session() as db:
            return db.query(Simulation).filter(
                Simulation.user_id == user_id
            ).order_by(desc(Simulation.created_at)).limit(limit).all()
    
    @staticmethod
    def get_simulation_by_id(simulation_id: str) -> Optional[Simulation]:
        """Get simulation by ID"""
        with get_db_session() as db:
            return db.query(Simulation).filter(Simulation.id == simulation_id).first()

class KeywordDataService:
    """Service for keyword data operations"""
    
    @staticmethod
    def create_keyword_data(
        keyword: str,
        match_type: str,
        avg_cpc: Optional[float] = None,
        competition: Optional[str] = None,
        search_volume: Optional[int] = None,
        quality_score: Optional[int] = None
    ) -> KeywordData:
        """Create keyword data"""
        with get_db_session() as db:
            keyword_data = KeywordData(
                keyword=keyword,
                match_type=match_type,
                avg_cpc=avg_cpc,
                competition=competition,
                search_volume=search_volume,
                quality_score=quality_score
            )
            
            db.add(keyword_data)
            db.commit()
            db.refresh(keyword_data)
            return keyword_data
    
    @staticmethod
    def search_keywords(keyword: str, limit: int = 50) -> List[KeywordData]:
        """Search for keywords"""
        with get_db_session() as db:
            return db.query(KeywordData).filter(
                KeywordData.keyword.contains(keyword)
            ).limit(limit).all()

class AccessRequestService:
    """Service for access request operations"""
    
    @staticmethod
    def create_access_request(
        email: str,
        name: str,
        company: Optional[str] = None,
        role: Optional[str] = None,
        reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> dict:
        """Create access request"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            request_id = str(uuid.uuid4())
            current_time = datetime.utcnow()
            
            cursor.execute("""
                INSERT INTO access_requests (id, email, name, company, role, reason, status, requested_at, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, request_id, email, name, company, role, reason, 'pending', current_time, notes)
            
            conn.close()
            
            return {
                "id": request_id,
                "email": email,
                "name": name,
                "company": company,
                "role": role,
                "reason": reason,
                "status": "pending",
                "requested_at": current_time,
                "notes": notes
            }
            
        except Exception as e:
            conn.close()
            raise e
    
    @staticmethod
    def get_pending_requests() -> List[AccessRequest]:
        """Get pending access requests"""
        with get_db_session() as db:
            return db.query(AccessRequest).filter(
                AccessRequest.status == "pending"
            ).order_by(asc(AccessRequest.requested_at)).all()
    
    @staticmethod
    def get_all_requests() -> List[dict]:
        """Get all access requests"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, email, name, company, role, reason, status, requested_at, reviewed_at, reviewed_by, notes
                FROM access_requests
                ORDER BY requested_at ASC
            """)
            
            requests = []
            for row in cursor.fetchall():
                requests.append({
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "company": row[3],
                    "role": row[4],
                    "reason": row[5],
                    "status": row[6],
                    "requested_at": row[7],
                    "reviewed_at": row[8],
                    "reviewed_by": row[9],
                    "notes": row[10]
                })
            
            return requests
            
        except Exception as e:
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def get_requests_by_status(status: str) -> List[dict]:
        """Get access requests filtered by status"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, email, name, company, role, reason, status, requested_at, reviewed_at, reviewed_by, notes
                FROM access_requests
                WHERE status = ?
                ORDER BY requested_at ASC
            """, status)
            
            requests = []
            for row in cursor.fetchall():
                requests.append({
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "company": row[3],
                    "role": row[4],
                    "reason": row[5],
                    "status": row[6],
                    "requested_at": row[7],
                    "reviewed_at": row[8],
                    "reviewed_by": row[9],
                    "notes": row[10]
                })
            
            return requests
            
        except Exception as e:
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def get_request_by_id(request_id: str) -> Optional[dict]:
        """Get a specific access request by id"""
        import pyodbc
        from app.database import DATABASE_CONFIG
        
        conn_str = f"DRIVER={{{DATABASE_CONFIG['driver']}}};SERVER={DATABASE_CONFIG['server']},{DATABASE_CONFIG['port']};DATABASE={DATABASE_CONFIG['database']};UID={DATABASE_CONFIG['username']};PWD={DATABASE_CONFIG['password']}"
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, email, name, company, role, reason, status, requested_at, reviewed_at, reviewed_by, notes
                FROM access_requests
                WHERE id = ?
            """, request_id)
            
            row = cursor.fetchone()
            if row:
                return {
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "company": row[3],
                    "role": row[4],
                    "reason": row[5],
                    "status": row[6],
                    "requested_at": row[7],
                    "reviewed_at": row[8],
                    "reviewed_by": row[9],
                    "notes": row[10]
                }
            return None
            
        except Exception as e:
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def update_request_status(
        request_id: str,
        status: str,
        reviewed_by: str,
        notes: Optional[str] = None
    ) -> Optional[AccessRequest]:
        """Update request status"""
        with get_db_session() as db:
            request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
            if request:
                request.status = status
                request.reviewed_at = datetime.utcnow()
                request.reviewed_by = reviewed_by
                if notes:
                    request.notes = notes
                db.commit()
                db.refresh(request)
            return request
