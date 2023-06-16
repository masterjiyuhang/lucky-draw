import axios from 'axios';
import qs from 'qs';

const http = axios.create({
  baseURL: '/base-api',
  timeout: 10000,
  headers: {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: params => qs.stringify(params)
});

http.interceptors.response.use(
  function(response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data.data;
  },
  function(error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);

// /evt/fr/winRecord/partInCompList
export const getPartInCompListApi = (
  params = {
    sessionId: 81
  }
) => {
  return http.post('/evt/fr/winRecord/partInCompList', params);
};
