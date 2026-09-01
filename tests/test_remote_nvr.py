import os
import sys
import unittest
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ingestion.remote_nvr import RemoteNVRClient

class TestRemoteNVRIntegration(unittest.TestCase):
    """
    Test suite for Separate Remote NVR Integration (VPN / Different Network).
    """

    def setUp(self):
        self.client = RemoteNVRClient()

    def test_vendor_rtsp_url_construction(self):
        # 1. Hikvision profile
        self.client.configure(host="10.8.0.2", port=554, username="admin", password="password123", channel=1, brand="Hikvision")
        url_hik = self.client.build_rtsp_url()
        self.assertIn("10.8.0.2:554/Streaming/Channels/101", url_hik)
        self.assertIn("admin:password123@", url_hik)

        # 2. CP Plus / Dahua profile
        self.client.configure(host="10.8.0.2", port=554, username="admin", password="password123", channel=2, brand="CP Plus")
        url_cpplus = self.client.build_rtsp_url()
        self.assertIn("10.8.0.2:554/cam/realmonitor?channel=2&subtype=0", url_cpplus)

        # 3. Uniview profile
        self.client.configure(host="10.8.0.2", port=554, username="admin", password="password123", channel=3, brand="Uniview")
        url_uniview = self.client.build_rtsp_url()
        self.assertIn("10.8.0.2:554/unicast/c3/s1/live", url_uniview)

        # 4. Custom RTSP override
        self.client.configure(host="10.8.0.2", custom_url="rtsp://10.8.0.2:8554/live/stream")
        url_custom = self.client.build_rtsp_url()
        self.assertEqual(url_custom, "rtsp://10.8.0.2:8554/live/stream")

    def test_reconnect_backoff_schedule(self):
        expected_backoffs = [2, 4, 8, 16, 30]
        for expected in expected_backoffs:
            self.client._handle_reconnect_backoff()
            self.assertEqual(self.client.current_backoff, expected)

    def test_jpeg_stream_generation(self):
        frame_bytes = self.client.get_jpeg_stream_frame()
        self.assertIsNotNone(frame_bytes)
        self.assertTrue(len(frame_bytes) > 100)

    def test_status_diagnostics(self):
        status = self.client.get_status()
        self.assertIn("nvr_host", status)
        self.assertIn("transport", status)
        self.assertEqual(status["transport"], "RTSP over TCP")
        self.assertTrue(status["ai_active"])

if __name__ == '__main__':
    unittest.main()
