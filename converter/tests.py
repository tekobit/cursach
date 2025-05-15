from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import FavouriteCurrencyPair, UserConversionHistory, ChangedCurrency
import json


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        self.converter_url = reverse('converter')

        self.test_username = 'testuser'
        self.test_password = 'testpassword123'

    def test_register_page_loads_correctly(self):
        response = self.client.get(self.register_url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'register.html')

    def test_successful_user_registration(self):
        self.assertFalse(User.objects.filter(username=self.test_username).exists())

        registration_data = {
            'username': self.test_username,
            'password1': self.test_password,
            'password2': self.test_password,
        }

        response = self.client.post(self.register_url, data=registration_data)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.converter_url)

        self.assertTrue(User.objects.filter(username=self.test_username).exists())

        user = User.objects.get(username=self.test_username)
        self.assertEqual(int(self.client.session.get('_auth_user_id')), user.id)

    def test_registration_with_existing_username(self):
        User.objects.create_user(username=self.test_username, password=self.test_password)
        self.assertTrue(User.objects.filter(username=self.test_username).exists())

        registration_data = {
            'username': self.test_username,
            'password1': 'anotherpassword123',
            'password2': 'anotherpassword123',
        }

        response = self.client.post(self.register_url, data=registration_data)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'register.html')

        self.assertEqual(User.objects.filter(username=self.test_username).count(), 1)

        self.assertIn('form', response.context)
        form = response.context['form']
        self.assertTrue(form.errors)
        self.assertIn('username', form.errors)

    def test_login_page_loads_correctly(self):
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'login.html')

    def test_successful_user_login(self):
        user = User.objects.create_user(username=self.test_username, password=self.test_password)

        login_data = {
            'username': self.test_username,
            'password': self.test_password,
        }

        response = self.client.post(self.login_url, data=login_data)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.converter_url)

        self.assertEqual(int(self.client.session.get('_auth_user_id')), user.id)

    def test_login_with_invalid_password(self):
        User.objects.create_user(username=self.test_username, password=self.test_password)

        login_data = {
            'username': self.test_username,
            'password': 'wrongpassword',
        }

        response = self.client.post(self.login_url, data=login_data)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'login.html')

        self.assertIsNone(self.client.session.get('_auth_user_id'))

        self.assertIn('form', response.context)
        form = response.context['form']
        self.assertTrue(form.errors)
        self.assertTrue(form.non_field_errors())

    def test_user_logout(self):
        User.objects.create_user(username=self.test_username, password=self.test_password)
        self.client.login(username=self.test_username, password=self.test_password)

        self.assertIsNotNone(self.client.session.get('_auth_user_id'))

        response = self.client.get(self.logout_url)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.converter_url)

        self.assertIsNone(self.client.session.get('_auth_user_id'))


class FavouritesApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'fav_user'
        self.password = 'fav_password123'
        self.user = User.objects.create_user(username=self.username, password=self.password)

        self.favourites_list_url = reverse('get_favourites')
        self.favourite_add_url = reverse('add_favourite')
        self.favourite_remove_url = reverse('remove_favourite')

        self.fav_data = {'from': 'USD', 'to': 'EUR'}

    def test_get_favourites_unauthenticated(self):
        response = self.client.get(self.favourites_list_url)
        expected_login_url = reverse('login')
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, f"{expected_login_url}?next={self.favourites_list_url}")

    def test_get_favourites_authenticated_empty(self):
        self.client.login(username=self.username, password=self.password)

        response = self.client.get(self.favourites_list_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        self.assertEqual(response.json(), [])

    def test_add_favourite_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 0)

        response = self.client.post(self.favourite_add_url,
                                    data=json.dumps(self.fav_data),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"success": True})

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 1)
        added_pair = FavouriteCurrencyPair.objects.get(user=self.user)
        self.assertEqual(added_pair.from_currency, self.fav_data['from'])
        self.assertEqual(added_pair.to_currency, self.fav_data['to'])

    def test_add_duplicate_favourite_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        response_first_add = self.client.post(self.favourite_add_url,
                                              data=json.dumps(self.fav_data),
                                              content_type='application/json')
        self.assertEqual(response_first_add.status_code, 201)
        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 1)

        response_second_add = self.client.post(self.favourite_add_url,
                                               data=json.dumps(self.fav_data),
                                               content_type='application/json')

        self.assertEqual(response_second_add.status_code, 400)
        self.assertEqual(response_second_add.json(), {"error": "Уже добавлено"})

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 1)

    def test_add_favourite_exceed_limit_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        for i in range(6):
            data_to_add = {'from': f'USD', 'to': f'EUR{i}'}
            response = self.client.post(self.favourite_add_url,
                                        data=json.dumps(data_to_add),
                                        content_type='application/json')
            self.assertEqual(response.status_code, 201)

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 6)

        response_seventh_add = self.client.post(self.favourite_add_url,
                                                data=json.dumps({'from': 'GBP', 'to': 'JPY'}),
                                                content_type='application/json')

        self.assertEqual(response_seventh_add.status_code, 400)
        self.assertEqual(response_seventh_add.json(), {"error": "Максимум 6 пар"})

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 6)

    def test_remove_favourite_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        self.client.post(self.favourite_add_url, data=json.dumps(self.fav_data), content_type='application/json')
        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 1)

        response = self.client.post(self.favourite_remove_url,
                                    data=json.dumps(self.fav_data),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 0)

    def test_remove_non_existent_favourite_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 0)

        response = self.client.post(self.favourite_remove_url,
                                    data=json.dumps(self.fav_data),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})

        self.assertEqual(FavouriteCurrencyPair.objects.filter(user=self.user).count(), 0)


class HistoryApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'history_user'
        self.password = 'history_password123'
        self.user = User.objects.create_user(username=self.username, password=self.password)

        self.history_list_url = reverse('get_history')
        self.history_add_url = reverse('add_history_entry')
        self.history_clear_url = reverse('clear_whole_user_history')
        self.history_delete_entry_url = reverse('delete_history_entry')

        self.history_entry_data1 = {'from': 'USD', 'to': 'EUR', 'amount': 100.0}
        self.history_entry_data2 = {'from': 'GBP', 'to': 'JPY', 'amount': 50.0}

    def test_get_history_unauthenticated(self):
        response = self.client.get(self.history_list_url)
        expected_login_url = reverse('login')
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, f"{expected_login_url}?next={self.history_list_url}")

    def test_get_history_authenticated_empty(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.get(self.history_list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        self.assertEqual(response.json(), [])

    def test_add_history_entry_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        response = self.client.post(self.history_add_url,
                                    data=json.dumps(self.history_entry_data1),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(UserConversionHistory.objects.filter(user=self.user).count(), 1)
        entry = UserConversionHistory.objects.get(user=self.user)
        self.assertEqual(entry.from_currency, self.history_entry_data1['from'])
        self.assertEqual(entry.to_currency, self.history_entry_data1['to'])
        self.assertEqual(entry.amount, self.history_entry_data1['amount'])

    def test_add_history_entry_update_timestamp(self):
        self.client.login(username=self.username, password=self.password)

        self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data1),
                         content_type='application/json')
        first_entry = UserConversionHistory.objects.get(user=self.user, from_currency=self.history_entry_data1['from'])
        first_timestamp = first_entry.timestamp

        import time
        time.sleep(0.01)

        response = self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data1),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        self.assertEqual(UserConversionHistory.objects.filter(user=self.user).count(), 1)
        updated_entry = UserConversionHistory.objects.get(user=self.user,
                                                          from_currency=self.history_entry_data1['from'])
        self.assertNotEqual(updated_entry.timestamp, first_timestamp)
        self.assertTrue(updated_entry.timestamp > first_timestamp)

    def test_get_history_authenticated_with_data(self):
        self.client.login(username=self.username, password=self.password)

        self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data1),
                         content_type='application/json')

        import time
        time.sleep(0.01)

        self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data2),
                         content_type='application/json')

        response = self.client.get(self.history_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

        self.assertEqual(data[0]['from'], self.history_entry_data2['from'])
        self.assertEqual(data[0]['amount'], self.history_entry_data2['amount'])

        self.assertEqual(data[1]['from'], self.history_entry_data1['from'])
        self.assertEqual(data[1]['amount'], self.history_entry_data1['amount'])

    def test_delete_single_history_entry_authenticated(self):
        self.client.login(username=self.username, password=self.password)
        self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data1),
                         content_type='application/json')
        self.assertEqual(UserConversionHistory.objects.filter(user=self.user).count(), 1)

        response = self.client.post(self.history_delete_entry_url,
                                    data=json.dumps(self.history_entry_data1),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertEqual(UserConversionHistory.objects.filter(user=self.user).count(), 0)

    def test_delete_non_existent_history_entry(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.history_delete_entry_url,
                                    data=json.dumps(self.history_entry_data1),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"error": "No matching entry found"})

    def test_clear_history_authenticated(self):
        self.client.login(username=self.username, password=self.password)
        self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data1),
                         content_type='application/json')
        self.client.post(self.history_add_url, data=json.dumps(self.history_entry_data2),
                         content_type='application/json')
        self.assertTrue(UserConversionHistory.objects.filter(user=self.user).exists())

        response = self.client.post(self.history_clear_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        self.assertFalse(UserConversionHistory.objects.filter(user=self.user).exists())

    def test_history_limit(self):
        self.client.login(username=self.username, password=self.password)
        max_history_size = 7

        for i in range(10):
            entry_data = {'from': 'USD', 'to': f'CUR{i}', 'amount': 10.0 + i}
            self.client.post(self.history_add_url, data=json.dumps(entry_data), content_type='application/json')

        self.assertTrue(UserConversionHistory.objects.filter(user=self.user).count() >= 7)

        response = self.client.get(self.history_list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 7)


class ChangedCurrencyApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.username = 'custom_rates_user'
        self.password = 'custom_rates_password123'
        self.user = User.objects.create_user(username=self.username, password=self.password)

        self.changed_list_url = reverse('get_changed_currencies')
        self.changed_add_url = reverse('add_changed_currency')
        self.changed_remove_url = reverse('remove_changed_currency')

        self.custom_rate_data1 = {
            'from': 'USD',
            'to': 'RUB',
            'fromValue': 1,
            'toValue': 100.0,
            'oldChangedCurrencyRate': 80.0
        }

        self.custom_rate_payload1 = {
            'from': 'RUB',
            'to': 'USD',
            'fromValue': 100,
            'toValue': 1,
            'oldChangedCurrencyRate': 0.0125
        }
        self.changed_currency_api_data1 = self.custom_rate_payload1

        self.changed_currency_api_data2 = {
            'from': 'EUR',
            'to': 'USD',
            'fromValue': 0.9,
            'toValue': 1,
            'oldChangedCurrencyRate': 1.1
        }

    def test_get_changed_currencies_unauthenticated(self):
        response = self.client.get(self.changed_list_url)
        expected_login_url = reverse('login')
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, f"{expected_login_url}?next={self.changed_list_url}")

    def test_get_changed_currencies_authenticated_empty(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.get(self.changed_list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        self.assertEqual(response.json(), {"data": []})

    def test_add_changed_currency_authenticated(self):
        self.client.login(username=self.username, password=self.password)

        response = self.client.post(self.changed_add_url,
                                    data=json.dumps(self.changed_currency_api_data1),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(ChangedCurrency.objects.filter(user=self.user).count(), 1)
        entry = ChangedCurrency.objects.get(user=self.user)
        self.assertEqual(entry.from_currency, self.changed_currency_api_data1['from'])
        self.assertEqual(entry.to_currency, self.changed_currency_api_data1['to'])
        self.assertEqual(entry.from_value, self.changed_currency_api_data1['fromValue'])
        self.assertEqual(entry.to_value, self.changed_currency_api_data1['toValue'])
        self.assertEqual(entry.old_changed_currency_rate, self.changed_currency_api_data1['oldChangedCurrencyRate'])

    def test_remove_changed_currency_authenticated(self):
        self.client.login(username=self.username, password=self.password)
        self.client.post(self.changed_add_url, data=json.dumps(self.changed_currency_api_data1),
                         content_type='application/json')
        self.assertEqual(ChangedCurrency.objects.filter(user=self.user).count(), 1)

        data_to_remove = {
            'from': self.changed_currency_api_data1['from'],
            'to': self.changed_currency_api_data1['to']
        }
        response = self.client.post(self.changed_remove_url,
                                    data=json.dumps(data_to_remove),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(ChangedCurrency.objects.filter(user=self.user).count(), 0)

    def test_get_changed_currencies_authenticated_with_data(self):
        self.client.login(username=self.username, password=self.password)
        self.client.post(self.changed_add_url, data=json.dumps(self.changed_currency_api_data1),
                         content_type='application/json')
        self.client.post(self.changed_add_url, data=json.dumps(self.changed_currency_api_data2),
                         content_type='application/json')

        response = self.client.get(self.changed_list_url)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('data', response_data)
        self.assertEqual(len(response_data['data']), 2)

        db_entries_from = [entry['from'] for entry in response_data['data']]
        self.assertIn(self.changed_currency_api_data1['from'], db_entries_from)
        self.assertIn(self.changed_currency_api_data2['from'], db_entries_from)
