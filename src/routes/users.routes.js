import { Router } from 'express'

const router = Router();

router.get('/users', (req, res) => {
    res.send('Obteniendo usuarios')
})

router.get('/users/:id', (req, res) => {
    const { id } = req.params
    res.send('Obteniend un usuario ' + id)
})

router.post('/users', (req, res) => {
    res.send('Creando usuario')
})

router.delete('/users/:id', (req, res) => {
    const { id } = req.params
    res.send('Eliminando usuario con id ' + id)
})

router.put('/users/:id', (req, res) => {
    res.send('Obteniendo usuarios')
})

export default router;