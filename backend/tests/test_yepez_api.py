"""
YEPEZ CONTROLS API Tests
Tests for motorcycle service center backend APIs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vento-moto-service.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@yepezcontrols.com"
ADMIN_PASSWORD = "Admin2026!"

class TestHealthAndAuth:
    """Health check and authentication tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "YEPEZ CONTROLS" in data["message"]
        print("✅ API root endpoint working")
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print("✅ Admin login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid credentials rejected correctly")


class TestDashboard:
    """Dashboard API tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_dashboard_stats(self, auth_headers):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify expected fields
        assert "total_services" in data
        assert "active_services" in data
        assert "total_revenue" in data
        assert "today_revenue" in data
        assert "low_stock_count" in data
        print(f"✅ Dashboard stats: {data['total_services']} services, ${data['total_revenue']} revenue")
    
    def test_dashboard_charts(self, auth_headers):
        """Test dashboard charts endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/charts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify chart data structure
        assert "daily_revenue" in data
        assert "services_by_status" in data
        assert "inventory_by_category" in data
        print("✅ Dashboard charts data retrieved")


class TestInventory:
    """Inventory management tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_inventory(self, auth_headers):
        """Test get inventory list"""
        response = requests.get(f"{BASE_URL}/api/inventory", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Inventory retrieved: {len(data)} items")
    
    def test_get_low_stock(self, auth_headers):
        """Test get low stock items"""
        response = requests.get(f"{BASE_URL}/api/inventory/low-stock", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Low stock items: {len(data)}")


class TestPayments:
    """Payment system tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_payments(self, auth_headers):
        """Test get payments list"""
        response = requests.get(f"{BASE_URL}/api/payments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Payments retrieved: {len(data)} payments")


class TestServices:
    """Service management tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_services(self, auth_headers):
        """Test get services list"""
        response = requests.get(f"{BASE_URL}/api/services", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Services retrieved: {len(data)} services")


class TestMechanics:
    """Mechanics management tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_mechanics(self, auth_headers):
        """Test get mechanics list"""
        response = requests.get(f"{BASE_URL}/api/mechanics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Mechanics retrieved: {len(data)} mechanics")


class TestWeeklyCut:
    """Weekly cut tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_check_saturday(self):
        """Test check if today is Saturday"""
        response = requests.get(f"{BASE_URL}/api/weekly-cut/check-saturday")
        assert response.status_code == 200
        data = response.json()
        assert "is_saturday" in data
        assert "day" in data
        print(f"✅ Saturday check: {data['day']} (is_saturday: {data['is_saturday']})")
    
    def test_get_weekly_cuts(self, auth_headers):
        """Test get weekly cuts history"""
        response = requests.get(f"{BASE_URL}/api/weekly-cuts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Weekly cuts retrieved: {len(data)} cuts")


class TestReports:
    """Reports export tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_sales_export(self, auth_headers):
        """Test sales export endpoint for PDF/Excel generation"""
        response = requests.get(f"{BASE_URL}/api/reports/sales/export", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify export data structure
        assert "generated_at" in data
        assert "summary" in data
        assert "payments" in data
        assert "total_revenue" in data["summary"]
        assert "cash_total" in data["summary"]
        assert "transfer_total" in data["summary"]
        print(f"✅ Sales export: ${data['summary']['total_revenue']} total revenue")
    
    def test_inventory_export(self, auth_headers):
        """Test inventory export endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports/inventory/export", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify export data structure
        assert "generated_at" in data
        assert "summary" in data
        assert "items" in data
        assert "total_items" in data["summary"]
        assert "total_value" in data["summary"]
        print(f"✅ Inventory export: {data['summary']['total_items']} items, ${data['summary']['total_value']} value")


class TestPublicTracking:
    """Public vehicle tracking tests"""
    
    def test_track_nonexistent_plate(self):
        """Test tracking with non-existent plate"""
        response = requests.get(f"{BASE_URL}/api/track/NONEXISTENT123")
        # Should return 404 for non-existent plate
        assert response.status_code == 404
        print("✅ Non-existent plate returns 404 correctly")
    
    def test_track_plate_format(self):
        """Test tracking endpoint accepts plate format"""
        response = requests.get(f"{BASE_URL}/api/track/ABC123")
        # Either 200 (found) or 404 (not found) is acceptable
        assert response.status_code in [200, 404]
        print(f"✅ Plate tracking endpoint responds: {response.status_code}")


class TestAppointments:
    """Appointments management tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_appointments(self, auth_headers):
        """Test get appointments list"""
        response = requests.get(f"{BASE_URL}/api/appointments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Appointments retrieved: {len(data)} appointments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
