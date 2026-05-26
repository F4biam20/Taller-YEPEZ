#!/usr/bin/env python3
"""
YEPEZ CONTROLS Backend API Testing Suite
Tests all endpoints for the motorcycle service center management system
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class YepezControlsAPITester:
    def __init__(self, base_url="https://vento-moto-service.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.mechanic_token = None
        self.client_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.admin_id = None
        self.mechanic_id = None
        self.appointment_id = None
        self.service_id = None
        self.payment_id = None
        self.inventory_item_id = None

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {error}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "error": error
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            return success, response.json() if success else {}, response.status_code, response.text
            
        except Exception as e:
            return False, {}, 0, str(e)

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, data, status, error = self.make_request('GET', '')
        self.log_test("API Root Endpoint", success, 
                     f"Status: {status}, Message: {data.get('message', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_seed_admin(self):
        """Test admin seeding"""
        success, data, status, error = self.make_request('POST', 'seed-admin')
        self.log_test("Seed Admin Account", success,
                     f"Admin email: {data.get('email', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@yepezcontrols.com",
            "password": "Admin2026!"
        }
        success, data, status, error = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'token' in data:
            self.admin_token = data['token']
            self.admin_id = data['user']['id']
            
        self.log_test("Admin Login", success,
                     f"Token received, User: {data.get('user', {}).get('name', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, data, status, error = self.make_request('GET', 'dashboard/stats', token=self.admin_token)
        self.log_test("Dashboard Statistics", success,
                     f"Total services: {data.get('total_services', 0)}, Revenue: ${data.get('total_revenue', 0)}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_create_mechanic(self):
        """Test mechanic creation"""
        mechanic_data = {
            "email": "mecanico1@yepezcontrols.com",
            "password": "Mech2026!",
            "name": "Carlos Hernández",
            "phone": "9931234567",
            "specialty": "Motor y Transmisión"
        }
        success, data, status, error = self.make_request('POST', 'mechanics', mechanic_data, self.admin_token)
        
        if success:
            self.mechanic_id = data.get('id')
            
        self.log_test("Create Mechanic", success,
                     f"Mechanic created: {data.get('name', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_mechanic_login(self):
        """Test mechanic login"""
        login_data = {
            "email": "mecanico1@yepezcontrols.com",
            "password": "Mech2026!"
        }
        success, data, status, error = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'token' in data:
            self.mechanic_token = data['token']
            
        self.log_test("Mechanic Login", success,
                     f"Mechanic logged in: {data.get('user', {}).get('name', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_get_mechanics(self):
        """Test get mechanics list"""
        success, data, status, error = self.make_request('GET', 'mechanics', token=self.admin_token)
        self.log_test("Get Mechanics List", success,
                     f"Found {len(data)} mechanics" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_create_appointment(self):
        """Test appointment creation"""
        appointment_data = {
            "client_name": "Juan Pérez",
            "client_phone": "9931234567",
            "client_email": "juan@example.com",
            "vehicle_plate": "ABC123",
            "vehicle_model": "VENTO 150",
            "vehicle_year": 2024,
            "service_type": "Servicio Mayor",
            "description": "Servicio completo de mantenimiento",
            "scheduled_date": "2026-03-10",
            "scheduled_time": "09:00"
        }
        success, data, status, error = self.make_request('POST', 'appointments', appointment_data, self.admin_token)
        
        if success:
            self.appointment_id = data.get('id')
            
        self.log_test("Create Appointment", success,
                     f"Appointment created for {data.get('vehicle_plate', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_get_appointments(self):
        """Test get appointments"""
        success, data, status, error = self.make_request('GET', 'appointments', token=self.admin_token)
        self.log_test("Get Appointments", success,
                     f"Found {len(data)} appointments" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_create_service(self):
        """Test service creation from appointment"""
        if not self.appointment_id:
            self.log_test("Create Service", False, "", "No appointment ID available")
            return False
            
        service_data = {
            "appointment_id": self.appointment_id,
            "diagnosis": "Requiere cambio de aceite y filtros",
            "estimated_cost": 1500.00
        }
        success, data, status, error = self.make_request('POST', 'services', service_data, self.admin_token)
        
        if success:
            self.service_id = data.get('id')
            
        self.log_test("Create Service", success,
                     f"Service created for {data.get('vehicle_plate', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_get_services(self):
        """Test get services"""
        success, data, status, error = self.make_request('GET', 'services', token=self.admin_token)
        self.log_test("Get Services", success,
                     f"Found {len(data)} services" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_create_payment(self):
        """Test mixed payment creation"""
        if not self.service_id:
            self.log_test("Create Payment", False, "", "No service ID available")
            return False
            
        payment_data = {
            "service_id": self.service_id,
            "total_amount": 1500.00,
            "transfer_amount": 1000.00,
            "cash_amount": 500.00,
            "cash_received": 500.00,
            "transfer_reference": "TXN123456789"
        }
        success, data, status, error = self.make_request('POST', 'payments', payment_data, self.admin_token)
        
        if success:
            self.payment_id = data.get('id')
            
        self.log_test("Create Mixed Payment", success,
                     f"Payment created: ${data.get('total_amount', 0)}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_assign_mechanic(self):
        """Test mechanic assignment (only after payment)"""
        if not self.service_id or not self.mechanic_id:
            self.log_test("Assign Mechanic", False, "", "Missing service or mechanic ID")
            return False
            
        assignment_data = {
            "mechanic_id": self.mechanic_id,
            "shift": "matutino",
            "status": "en_reparacion"
        }
        success, data, status, error = self.make_request('PUT', f'services/{self.service_id}', assignment_data, self.admin_token)
        
        self.log_test("Assign Mechanic to Service", success,
                     f"Mechanic assigned: {data.get('mechanic_name', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_update_progress(self):
        """Test progress update by mechanic"""
        if not self.service_id:
            self.log_test("Update Progress", False, "", "No service ID available")
            return False
            
        success, data, status, error = self.make_request('PUT', f'services/{self.service_id}/progress?progress=75', 
                                                        token=self.mechanic_token)
        
        self.log_test("Update Service Progress", success,
                     f"Progress updated to {data.get('progress', 0)}%" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_create_inventory_item(self):
        """Test inventory item creation"""
        item_data = {
            "name": "Aceite Motor 20W-50",
            "sku": "ACE001",
            "category": "Aceites",
            "quantity": 25,
            "min_stock": 5,
            "unit_price": 85.50,
            "supplier": "Castrol México"
        }
        success, data, status, error = self.make_request('POST', 'inventory', item_data, self.admin_token)
        
        if success:
            self.inventory_item_id = data.get('id')
            
        self.log_test("Create Inventory Item", success,
                     f"Item created: {data.get('name', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_get_inventory(self):
        """Test get inventory"""
        success, data, status, error = self.make_request('GET', 'inventory', token=self.admin_token)
        self.log_test("Get Inventory", success,
                     f"Found {len(data)} inventory items" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_low_stock_alert(self):
        """Test low stock items"""
        success, data, status, error = self.make_request('GET', 'inventory/low-stock', token=self.admin_token)
        self.log_test("Low Stock Alert", success,
                     f"Found {len(data)} low stock items" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_client_tracking(self):
        """Test client portal tracking"""
        success, data, status, error = self.make_request('GET', 'track/ABC123')
        self.log_test("Client Vehicle Tracking", success,
                     f"Vehicle found: {data.get('vehicle_plate', '')} - Progress: {data.get('progress', 0)}%" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_weekly_cut_check(self):
        """Test weekly cut Saturday check"""
        success, data, status, error = self.make_request('GET', 'weekly-cut/check-saturday')
        self.log_test("Weekly Cut Saturday Check", success,
                     f"Is Saturday: {data.get('is_saturday', False)}, Day: {data.get('day', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_weekly_cut(self):
        """Test weekly cut with PIN"""
        cut_data = {
            "pin": "UJAT2026",
            "notes": "Corte de prueba automatizado"
        }
        success, data, status, error = self.make_request('POST', 'weekly-cut', cut_data, self.admin_token)
        self.log_test("Weekly Cut with PIN", success,
                     f"Cut created: ${data.get('total_revenue', 0)} revenue" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def test_client_registration(self):
        """Test client registration"""
        client_data = {
            "email": "cliente1@example.com",
            "password": "Cliente123!",
            "name": "María González",
            "phone": "9931234567"
        }
        success, data, status, error = self.make_request('POST', 'auth/register', client_data)
        
        if success and 'token' in data:
            self.client_token = data['token']
            
        self.log_test("Client Registration", success,
                     f"Client registered: {data.get('user', {}).get('name', '')}" if success else "",
                     f"Status: {status}, Error: {error}" if not success else "")
        return success

    def run_all_tests(self):
        """Run complete test suite"""
        print("🔧 YEPEZ CONTROLS API Testing Suite")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ Cannot connect to API. Stopping tests.")
            return False
            
        # Authentication & Setup
        self.test_seed_admin()
        if not self.test_admin_login():
            print("❌ Admin login failed. Stopping tests.")
            return False
            
        # Dashboard
        self.test_dashboard_stats()
        
        # Mechanics Management
        self.test_create_mechanic()
        self.test_mechanic_login()
        self.test_get_mechanics()
        
        # Appointments
        self.test_create_appointment()
        self.test_get_appointments()
        
        # Services & Production
        self.test_create_service()
        self.test_get_services()
        
        # Payment System (Mixed Payment)
        self.test_create_payment()
        
        # Assignment (only after payment)
        self.test_assign_mechanic()
        
        # Progress Updates
        self.test_update_progress()
        
        # Inventory Management
        self.test_create_inventory_item()
        self.test_get_inventory()
        self.test_low_stock_alert()
        
        # Client Portal
        self.test_client_tracking()
        self.test_client_registration()
        
        # Weekly Cut
        self.test_weekly_cut_check()
        self.test_weekly_cut()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = YepezControlsAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        
        # Save detailed results
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
                'results': tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())