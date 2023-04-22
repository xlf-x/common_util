export default function urlHandler (url) {
    if (!url) return console.warn('string url is required!')
    const isAlipayFinanceApi = /^alipayFinanceApi:/.test(url) // 金融接口
    const isNewFortuneShop = url.indexOf('nbupdate=syncforce') !== -1 // 新版财富号
    const isMpPage = /^pages:/.test(url) // 二级页
    const isMiniProgram = /^mp:/.test(url)
    /** */
    if (isAlipayFinanceApi) {
        return mpAlipayToFinancePage(url)
    } else if (isNewFortuneShop) {
        return mpAlipayToFortuneShop(url)
    } else if (isMpPage) {
        return mpAlipayToInnerPage(url)
    } else if (isMiniProgram) {
        return mpAlipayToMpAlipay(url)
    } else {
        /** 兼容小程序链接： */
        if (/^alipays:\/\/platformapi\/startapp\?appId=/.test(url)) {
            const appId = url.split('alipays://platformapi/startapp?appId=')[1]
            if (String(appId).length === 16) {
                return mpAlipayToMpAlipay(`mp:appId=${appId}`)
            }
        }
        return mpAlipayToAlipayPage(url)
    }
    function urlToObj (url) {
        const string = url.split('&')
        const res = {}
        for (let i = 0; i < string.length; i++) {
            const str = string[i].split('=')
            if (str[0] !== '') {
                res[str[0]] = str[1]
            }
        }
        return res
    }
    function getQueryString (str, name) {
        const search = str.split('?')[1]
        if (search) {
            const params = search.split('&')
            for (var i in params) {
                var param = params[i].split('=')
                if (param[0] === name) {
                    return param[1]
                }
            }
        }
        return null
    }
    /** 支持的场景
     * 金融接口：alipayFinanceApi:{queryStr}，根据文档
     * 新版财富号: 从财富号后台复制的链接
     * 支付宝应用页: 1. 旧版财富号首页链接；2. 基金详情页：从财富号后台的“全部产品”的管理模块中自主获取链接；3. 凤蝶场景页(https://open.antfortune.com/XXX)； 4. 蚂蚁社区：https://render.alipay.com
     * 其它小程序：mp:{queryStr} appId必填
     * 小程序二级页：
     */
    function canIUse (str) {
        return new Promise((resolve, reject) => {
            console.log('str', str)
            if (my.canIUse(str)) {
                resolve()
            } else {
                my.showToast({
                    content: '支付宝版本过低，请升级后重试'
                })
                reject()
            }
        })
    }
    // 金融api接口
    function mpAlipayToFinancePage (url) {
        const searchStr = url.split(':')[1]
        const options = urlToObj(searchStr)
        // h5特殊处理
        if (options.type === 'h5Page') {
            options.url = decodeURIComponent(options.url)
        }
        if (options.showAntWealth) {
            options.showAntWealth = options.showAntWealth !== 'false'
        }
        console.log('options', options)
        return new Promise(async (resolve, reject) => {
            await canIUse('ap.navigateToFinance')
            my.ap.navigateToFinance({
                ...options,
                success: resolve,
                fail: reject
            })
        })
    }
    // 蚂蚁财富号
    function mpAlipayToFortuneShop (url) {
        const appId = getQueryString(url, 'appId')
        const publicId = getQueryString(url, 'query').substring(11)
        return new Promise(async (resolve, reject) => {
            await canIUse('navigateToMiniProgram')
            my.navigateToMiniProgram({
                appId: appId,
                extraData: {
                    publicId: publicId
                },
                success: resolve,
                fail: reject
            })
        })
    }
    // 支付宝小程序
    function mpAlipayToMpAlipay (url) {
        const searchStr = url.split(':')[1]
        const options = urlToObj(searchStr)
        if (!options.appId) return console.warn('appId is required!')
        return new Promise(async (resolve, reject) => {
            await canIUse('navigateToMiniProgram')
            my.navigateToMiniProgram({
                appId: options.appId,
                extraData: options,
                success: resolve,
                fail: reject
            })
        })
    }
    // 支付宝应用页：部分支持
    /**
     * 社区链接：https://render.alipay.com/p/f/fd-j1xcs5me/comment-share.html?commentId=2019011563045008776bf478-c4e1-4a72-b77c-d2184f816a5b
     * 场景页(https://open.antfortune.com/XXX)
     * 旧版财富号首页: pid:{pid}
     * 基金详情页: 从财富号后台的“全部产品”的管理模块中自主获取链接
     */
    function mpAlipayToAlipayPage (path) {
        const isPID = /^pid:/.test(path)
        if (isPID) {
            const pid = path.split(':')[1]
            path = `alipays://platformapi/startapp?appId=60000148&appClearTop=false&sms=YES&so=NO&ttb=auto&ttta=YES&url=/www/shop.html?pid=${pid}`
        }
        return new Promise(async (resolve, reject) => {
            if (/^alipays:\/\//.test(path)) {
                await canIUse('ap.navigateToFinance')
                my.ap.navigateToFinance({
                    type: 'h5Page',
                    url: 'https://ds.alipay.com/?scheme=' + encodeURIComponent(path),
                })
            } else {
                await canIUse('ap.navigateToAlipayPage')
                my.ap.navigateToAlipayPage({
                    path: path,
                    success: resolve,
                    fail: reject
                })
            }
        })
    }
    // 小程序二级页
    function mpAlipayToInnerPage (url) {
        url = url.split('pages:')[1]
        return new Promise((resolve, reject) => {
            return my.navigateTo({
                url,
                success: resolve,
                fail: reject
            })
        })
    }
}
