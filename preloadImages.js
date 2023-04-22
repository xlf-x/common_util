const preloadImages = (arr) => {
    if (!arr || !arr.length) {
        return
    }
    const promiseArr = []
    arr.forEach(s => {
        if (s) {
            promiseArr.push(loadImage(s))
        }
    })
}
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            resolve()
        }
        img.onerror = () => {
            console.log(src + '预加载失败')
            reject(src + '预加载失败')
        }
        img.src = src
    })
}

export default preloadImages
