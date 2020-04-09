const Router = require('koa-router');
const router = new Router();
const mainCtrl = require('../controllers/main');

const handler = (ctx, next) => {
    ctx.body = `${ctx.request.method} ${ctx.request.path}`;
};
router.get('/', mainCtrl.list);
router.post('/', mainCtrl.create);
router.delete('/', mainCtrl.delete);
router.put('/', mainCtrl.replace);
router.patch('/', mainCtrl.update);

module.exports = router;