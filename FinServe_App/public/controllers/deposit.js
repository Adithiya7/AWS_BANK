(function() {
    "use strict";
    angular.module('BankApp').controller('depositCtrl', depositCtrl);
  
    depositCtrl.$inject = ['$scope', '$timeout', 'Account', 'Transaction', 'CustomerData'];
  
    function depositCtrl($scope, $timeout, Account, Transaction, CustomerData) {
      $scope.$parent.logout = true;
      $scope.amount = "";
      $scope.message = "";
  
      $scope.deposit = function() {
        const user = CustomerData.getUser();
        const account = CustomerData.getAccount();
        const depositAmount = $scope.amount; // Capture before reset
  
        if (!user || !account || !depositAmount) {
          console.warn("❗ Missing data", { user, account, depositAmount });
          $scope.message = "User, account, or amount missing.";
          return;
        }
  
        const txObj = Transaction.deposit(user.id, account.accountNo, depositAmount);
  
        if (txObj.success) {
          $scope.message = "Deposit Successful";
          $scope.$emit('amountChg');
        } else {
          $scope.message = "Something went wrong. Please try again.";
        }
  
        $timeout(function() {
          // Save local storage
          Account.saveObj();
          Transaction.saveObj();
  
          // ✅ Log to backend
          console.log("📤 Sending to backend:", {
            accountId: account.accountNo,
            amount: depositAmount
          });
  
          fetch('/api/deposit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              accountId: account.accountNo,
              amount: depositAmount
            })
          }).then(res => res.json())
            .then(data => console.log("✅ Server Response:", data))
            .catch(err => console.error("❌ Backend error:", err));
        }, 0);
  
        // Clear amount input
        $scope.amount = "";
      };
    }
  })();
  