class APIResponse {
  apiCode: number;
  data: Object;
  message: string;
  constructor(_apiCode: number, _data: Object, _message: string) {
    this.apiCode = _apiCode;
    this.data = _data;
    this.message = _message;
  }
};

export {
  APIResponse
};
