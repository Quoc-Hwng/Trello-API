
/**
 * Định nghĩa riêng một Class ApiError kế thừa class Error sẵn (điều này cần thiết và là Best Practice vì class Error nó là class built-in sẵn)
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        // Gọi tới hàm khởi tạo của class Error (class cha) để còn dùng this
        super(message)

        // Tên custom Error, nếu không set thì mặc định sẽ kế thừa là "Error"
        this.name = 'ApiError'

        // Gán http status code
        this.statusCode = statusCode

        // Ghi lại Stack Trace để thuận tiện debug
        Error.captureStackTrace(this, this.constructor)
    }
}

export default ApiError