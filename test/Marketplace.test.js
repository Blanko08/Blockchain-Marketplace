const Marketplace = artifacts.require('./Marketplace.sol');
	
require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Marketplace', ([deployer, seller, buyer]) => {
    let marketplace

    before(async () => {
        marketplace = await Marketplace.deployed();
    });

    describe('Deployment', async () => {
        it('Deploys Successfully', async () => {
            const address = await marketplace.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });
    });

    describe('Products', async () => {
        let result, productCount;

        before(async () => {
            result = await marketplace.createProduct('IPhoneX', web3.utils.toWei('1', 'Ether'), { from: seller });
            productCount = await marketplace.productCount();
        });

        it('Creates Products', async () => {
            // ---SUCCESS---
            // Comprueba que el ID aumenta.
            assert.equal(productCount, 1, 'No se ha creado ningun producto.');

            // Comprueba que el producto se ha creado correctamente.
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'ID incorrecto.');
            assert.equal(event.name, 'IPhoneX', 'Nombre incorrecto.');
            assert.equal(event.price, '1000000000000000000', 'Precio incorrecto.');
            assert.equal(event.owner, seller, 'Dueño incorrecto.');
            assert.equal(event.purchased, false, 'Estado incorrecto.');

            // ---FAILURE---
            // No debe dejar que puedas crear un producto sin nombre.
            await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;

            // No debe dejar que puedas crear un producto que su precio sea 0.
            await marketplace.createProduct('IPhoneX', 0, { from: seller }).should.be.rejected;
        });

        it('Lists Products', async () => {
            const product = await marketplace.products(productCount);
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'ID incorrecto.');
            assert.equal(product.name, 'IPhoneX', 'Nombre incorrecto.');
            assert.equal(product.price, '1000000000000000000', 'Precio incorrecto.');
            assert.equal(product.owner, seller, 'Dueño incorrecto.');
            assert.equal(product.purchased, false, 'Estado incorrecto.');
        });

        it('Sells Products', async () => {
            let oldSellerBalance;
            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = new web3.utils.BN(oldSellerBalance);

            // ---SUCCESS---
            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') });

            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'ID incorrecto.');
            assert.equal(event.name, 'IPhoneX', 'Nombre incorrecto.');
            assert.equal(event.price, '1000000000000000000', 'Precio incorrecto.');
            assert.equal(event.owner, buyer, 'Dueño incorrecto.');
            assert.equal(event.purchased, true, 'Estado incorrecto.');

            // Comprueba que el dueño recibe los fondos.
            let newSellerBalance;
            newSellerBalance = await web3.eth.getBalance(seller);
            newSellerBalance = new web3.utils.BN(newSellerBalance);

            let price;
            price = await web3.utils.toWei('1', 'Ether');
            price = new web3.utils.BN(price);

            const expectedBalance = oldSellerBalance.add(price);
            assert.equal(newSellerBalance.toString(), expectedBalance.toString(), 'Balance del dueño incorrecto.');

            // ---FAILURE---
            // No debe dejar comprar un producto que no existe.
            await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;

            // No debe dejar comprar un producto si no pagas lo suficiente.
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected;

            // No debe dejar comprar un producto si ya eres dueño de el.
            await marketplace.purchaseProduct(productCount, { from: seller, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected;
        });
    });
});
